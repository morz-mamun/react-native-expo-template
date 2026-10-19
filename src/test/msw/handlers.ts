import { http, HttpResponse } from 'msw';

export const API = 'https://dummyjson.com';

export const DEMO_USER = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
};

export function makePost(id: number, overrides: Record<string, unknown> = {}) {
  return { id, title: `Post ${id}`, body: `Body of post ${id}`, userId: 1, tags: [], reactions: { likes: id, dislikes: 0 }, views: 10, ...overrides };
}

/**
 * Default "happy path" API. Tests override individual endpoints with `server.use(...)`.
 * Mirrors the dummyjson contract used by the app.
 */
export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username?: string; password?: string };
    if (body.username !== 'emilys' || body.password !== 'emilyspass')
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 });
    return HttpResponse.json({ ...DEMO_USER, accessToken: 'access-1', refreshToken: 'refresh-1' });
  }),

  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' })),

  http.get(`${API}/auth/me`, () => HttpResponse.json(DEMO_USER)),

  http.get(`${API}/auth/posts`, ({ request }) => {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get('skip') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const total = 45;
    const posts = Array.from({ length: Math.max(0, Math.min(limit, total - skip)) }, (_, i) => makePost(skip + i + 1));
    return HttpResponse.json({ posts, total, skip, limit });
  }),

  http.get(`${API}/auth/posts/:id`, ({ params }) => HttpResponse.json(makePost(Number(params.id)))),

  http.post(`${API}/auth/posts/add`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 252, ...body }, { status: 201 });
  }),
];
