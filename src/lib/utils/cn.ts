import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names: conditional classes (clsx) + Tailwind conflict resolution (tailwind-merge),
 * so `cn('px-2', className)` lets callers override defaults predictably.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
