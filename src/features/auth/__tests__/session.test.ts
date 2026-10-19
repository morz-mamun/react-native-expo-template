import { HttpResponse, http as msw } from 'msw';

import { fetchCurrentUser } from '@/features/auth/api';
import { useSession } from '@/features/auth/session-store';
import { queryClient } from '@/lib/api/query-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { queryCacheStorage } from '@/lib/storage/mmkv';
import { toast } from '@/lib/toast';
import { API, DEMO_USER } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

/** /auth/me only accepts the CURRENT access token; counts refresh calls. */
function protectedApi({ refresh }: { refresh: 'ok' | 'reject' | 'offline' }) {
  const calls = { refresh: 0 };
  let validToken = 'access-1';
  server.use(
    msw.get(`${API}/auth/me`, ({ request }) =>
      request.headers.get('Authorization') === `Bearer ${validToken}`
        ? HttpResponse.json(DEMO_USER)
        : HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 })),
    msw.post(`${API}/auth/refresh`, async () => {
      calls.refresh++;
      await new Promise(resolve => setTimeout(resolve, 20)); // let concurrent 401s pile up
      if (refresh === 'offline')
        return HttpResponse.error();
      if (refresh === 'reject')
        return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 403 });
      validToken = 'access-2';
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    }),
  );
  return calls;
}

async function signIn() {
  await useSession.getState().signIn({ username: 'emilys', password: 'emilyspass' });
}

beforeEach(async () => {
  useSession.setState({ status: 'signedOut', user: null });
  await tokenStorage.clear();
  queryClient.clear();
});

describe('session', () => {
  it('signs in: stores tokens and the user', async () => {
    await signIn();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', user: { username: 'emilys' } });
    expect(tokenStorage.getAccessToken()).toBe('access-1');
  });

  it('rejects wrong credentials without creating a session', async () => {
    await expect(useSession.getState().signIn({ username: 'emilys', password: 'nope' })).rejects.toMatchObject({ kind: 'validation', status: 400 });
    expect(useSession.getState().status).toBe('signedOut');
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('concurrent 401s → exactly one refresh → every request retried with the new token', async () => {
    await signIn();
    const calls = protectedApi({ refresh: 'ok' });
    tokenStorage.debugInvalidateAccessToken();

    const users = await Promise.all([fetchCurrentUser(), fetchCurrentUser(), fetchCurrentUser()]);

    expect(calls.refresh).toBe(1);
    expect(users).toHaveLength(3);
    expect(tokenStorage.getAccessToken()).toBe('access-2');
    expect(useSession.getState().status).toBe('signedIn');
  });

  it('rejected refresh → signs out once, clears tokens and cached data, tells the user', async () => {
    await signIn();
    queryClient.setQueryData(['private'], 'user A data');
    queryCacheStorage.set('react-query', '{"cached":true}');
    const calls = protectedApi({ refresh: 'reject' });
    tokenStorage.debugInvalidateAccessToken();

    const results = await Promise.allSettled([fetchCurrentUser(), fetchCurrentUser()]);

    expect(results.every(r => r.status === 'rejected')).toBe(true);
    expect(calls.refresh).toBe(1);
    await waitForSignedOut();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    expect(queryCacheStorage.getString('react-query')).toBeUndefined();
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith('Session expired', expect.anything());
  });

  it('refresh fails because the device is offline → session is KEPT', async () => {
    await signIn();
    protectedApi({ refresh: 'offline' });
    tokenStorage.debugInvalidateAccessToken();

    await expect(fetchCurrentUser()).rejects.toMatchObject({ kind: 'network' });

    expect(useSession.getState().status).toBe('signedIn');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1');
  });

  it.each([
    ['tokens in the keychain', true, 'signedIn'],
    ['no tokens', false, 'signedOut'],
  ])('cold start with %s → %s', async (_label, hasTokens, expected) => {
    // Fresh module registry = a real cold start (hydration is guarded per app launch).
    await jest.isolateModulesAsync(async () => {
      const SecureStore = require('expo-secure-store');
      if (hasTokens) {
        await SecureStore.setItemAsync('auth.accessToken', 'access-1');
        await SecureStore.setItemAsync('auth.refreshToken', 'refresh-1');
      }
      const { useSession: freshSession } = require('@/features/auth/session-store');
      expect(freshSession.getState().status).toBe('idle'); // splash still up

      await freshSession.getState().hydrate();

      expect(freshSession.getState().status).toBe(expected);
    });
  });
});

async function waitForSignedOut() {
  for (let i = 0; i < 50 && useSession.getState().status !== 'signedOut'; i++)
    await new Promise(resolve => setTimeout(resolve, 10));
  expect(useSession.getState().status).toBe('signedOut');
}
