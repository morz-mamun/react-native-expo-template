import type { InfiniteData } from '@tanstack/react-query';

/** Normalised page shape for offset/limit APIs (`?limit=20&skip=40`). */
export type OffsetPage<T> = {
  items: T[];
  total: number;
  skip: number;
  limit: number;
};

/** Normalised page shape for cursor APIs (`?cursor=abc`). */
export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

/** `getNextPageParam` for offset pagination: the next `skip`, or undefined at the end. */
export function getNextOffset<T>(lastPage: OffsetPage<T>): number | undefined {
  const next = lastPage.skip + lastPage.items.length;
  return lastPage.items.length > 0 && next < lastPage.total ? next : undefined;
}

/** `getNextPageParam` for cursor pagination. */
export function getNextCursor<T>(lastPage: CursorPage<T>): string | undefined {
  return lastPage.nextCursor ?? undefined;
}

/** All items across loaded pages, in order. */
export function flattenPages<T>(data: InfiniteData<{ items: T[] }> | undefined): T[] {
  return data?.pages.flatMap(page => page.items) ?? [];
}
