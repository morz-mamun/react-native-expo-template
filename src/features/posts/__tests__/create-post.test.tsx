import type { InfiniteData } from '@tanstack/react-query';
import type { PostsPage } from '@/features/posts/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { HttpResponse, http as msw } from 'msw';

import { useSession } from '@/features/auth/session-store';
import { useCreatePost } from '@/features/posts/api';
import { postKeys } from '@/features/posts/keys';
import { API, DEMO_USER, makePost } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { createTestQueryClient } from '@/test/test-utils';

const listKey = postKeys.list({});
const initialList: InfiniteData<PostsPage> = {
  pages: [{ items: [makePost(1), makePost(2)], total: 2, skip: 0, limit: 20 }],
  pageParams: [0],
};

function titles(client: ReturnType<typeof createTestQueryClient>) {
  return client.getQueryData<InfiniteData<PostsPage>>(listKey)?.pages[0]?.items.map(p => p.title);
}

async function setup() {
  useSession.setState({ status: 'signedIn', user: DEMO_USER });
  const client = createTestQueryClient();
  client.setQueryData(listKey, initialList);
  const { result } = await renderHook(() => useCreatePost(), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { client, result };
}

describe('useCreatePost (optimistic)', () => {
  it('shows the new post immediately, then swaps in the server version', async () => {
    let release!: () => void;
    server.use(msw.post(`${API}/auth/posts/add`, async ({ request }) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return HttpResponse.json({ id: 252, ...(await request.json() as object) }, { status: 201 });
    }));
    const { client, result } = await setup();

    await act(async () => {
      result.current.mutate({ title: 'Hello world', body: 'A brand new post' });
    });
    // Optimistic: at the top of the list before the server answered.
    await waitFor(() => expect(titles(client)).toEqual(['Hello world', 'Post 1', 'Post 2']));
    expect(client.getQueryData<InfiniteData<PostsPage>>(listKey)?.pages[0]?.items[0]?.id).toBeLessThan(0);

    await act(async () => release());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<InfiniteData<PostsPage>>(listKey)?.pages[0]?.items[0]?.id).toBe(252);
  });

  it('rolls the list back when the server rejects the post', async () => {
    server.use(msw.post(`${API}/auth/posts/add`, () => HttpResponse.json({ message: 'Nope' }, { status: 500 })));
    const { client, result } = await setup();

    await act(async () => {
      result.current.mutate({ title: 'Hello world', body: 'A brand new post' });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(titles(client)).toEqual(['Post 1', 'Post 2']);
    expect(result.current.error?.kind).toBe('server');
  });
});
