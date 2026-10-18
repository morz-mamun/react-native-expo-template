import { z } from 'zod';

/** A post as returned by the API (dummyjson.com/posts). */
export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  userId: z.number(),
  tags: z.array(z.string()).default([]),
  reactions: z.object({ likes: z.number(), dislikes: z.number() }).default({ likes: 0, dislikes: 0 }),
  views: z.number().default(0),
});
export type Post = z.infer<typeof postSchema>;

/** Raw list response: `{ posts, total, skip, limit }`. */
export const postsResponseSchema = z.object({
  posts: z.array(postSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

/** Form input for creating a post — also the client-side validation rules. */
export const createPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Keep the title under 120 characters'),
  body: z.string().trim().min(10, 'Write at least 10 characters').max(2000, 'Keep it under 2000 characters'),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

/** Avatar for a post's author. dummyjson serves deterministic identicons. */
export function authorAvatarUrl(userId: number, size = 96) {
  return `https://dummyjson.com/icon/user-${userId}/${size}`;
}
