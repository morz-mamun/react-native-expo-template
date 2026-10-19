import { HttpResponse, http as msw } from 'msw';

import { PostsScreen } from '@/features/posts/screens/posts-screen';
import { API } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { fireEvent, renderWithProviders, screen } from '@/test/test-utils';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('postsScreen', () => {
  it('shows posts from the API', async () => {
    await renderWithProviders(<PostsScreen />);

    expect(await screen.findByText('Post 1')).toBeOnTheScreen();
    expect(screen.getByText('Body of post 1')).toBeOnTheScreen();
  });

  it('shows an error with retry, and recovers when retry succeeds', async () => {
    server.use(msw.get(`${API}/auth/posts`, () => HttpResponse.json({ message: 'boom' }, { status: 500 }), { once: true }));
    await renderWithProviders(<PostsScreen />);

    expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Post 1')).toBeOnTheScreen();
  });

  it('shows the empty state when there are no posts', async () => {
    server.use(msw.get(`${API}/auth/posts`, () => HttpResponse.json({ posts: [], total: 0, skip: 0, limit: 20 })));
    await renderWithProviders(<PostsScreen />);

    expect(await screen.findByText('No posts yet')).toBeOnTheScreen();
  });
});
