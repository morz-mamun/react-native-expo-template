import { HttpResponse, http as msw } from 'msw';

import { http } from '@/lib/api/client';
import { ApiError, toApiError } from '@/lib/api/errors';
import { API } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

async function failingRequest(): Promise<ApiError> {
  try {
    await http.get('auth/posts/1');
  }
  catch (error) {
    return toApiError(error);
  }
  throw new Error('expected the request to fail');
}

function respondWith(body: unknown, status: number) {
  server.use(msw.get(`${API}/auth/posts/1`, () => HttpResponse.json(body as object, { status })));
}

describe('apiError normalisation (real client → MSW)', () => {
  it('404 → not_found with the server message', async () => {
    respondWith({ message: 'Post not found' }, 404);
    const error = await failingRequest();
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'not_found', status: 404, message: 'Post not found', isClientError: true });
  });

  it('422 → validation with field errors (object shape)', async () => {
    respondWith({ message: 'Invalid', errors: { title: ['Too short'], body: 'Required' } }, 422);
    const error = await failingRequest();
    expect(error.kind).toBe('validation');
    expect(error.fieldErrors).toEqual({ title: ['Too short'], body: ['Required'] });
  });

  it('400 → validation with field errors (array shape)', async () => {
    respondWith({ errors: [{ field: 'title', message: 'Too short' }, { path: ['meta', 'tag'], message: 'Bad tag' }] }, 400);
    const error = await failingRequest();
    expect(error.fieldErrors).toEqual({ 'title': ['Too short'], 'meta.tag': ['Bad tag'] });
  });

  it('500 → server, hiding internal details from users', async () => {
    respondWith({ message: 'NullPointerException at Foo.java:42' }, 500);
    const error = await failingRequest();
    expect(error.kind).toBe('server');
    expect(error.message).not.toContain('NullPointer');
  });

  it('connection failure → network', async () => {
    server.use(msw.get(`${API}/auth/posts/1`, () => HttpResponse.error()));
    const error = await failingRequest();
    expect(error).toMatchObject({ kind: 'network', isNetworkError: true });
  });

  it('passes ApiErrors through unchanged and wraps unknown values', () => {
    const original = new ApiError({ kind: 'conflict' });
    expect(toApiError(original)).toBe(original);
    expect(toApiError('boom').kind).toBe('unknown');
  });
});
