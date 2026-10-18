import { z } from 'zod';

/** The signed-in user, as returned by login and `GET auth/me`. Adapt to your backend. */
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.string().optional(),
});
export type User = z.infer<typeof userSchema>;

export const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

/** Login response = tokens + user (dummyjson returns them flat). */
export const loginResponseSchema = tokensSchema.and(userSchema);

/**
 * Login form. The demo API (dummyjson) signs in with a USERNAME. For an email-based backend,
 * rename the field to `email` and use `z.email('Enter a valid email')`.
 */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export function displayName(user: Pick<User, 'firstName' | 'lastName' | 'username'>) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
}
