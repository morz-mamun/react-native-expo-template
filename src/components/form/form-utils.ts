import type { AnyFieldApi, AnyFormApi } from '@tanstack/react-form';

import { ApiError } from '@/lib/api/errors';

function messageOf(error: unknown): string | undefined {
  if (typeof error === 'string')
    return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
    return error.message; // Zod / Standard Schema issue
  return undefined;
}

/**
 * The error to show for a field: only after the user has touched it or tried to submit,
 * so a fresh form isn't covered in red. Server errors (from `applyServerFieldErrors`) always show.
 */
export function getFieldError(field: AnyFieldApi): string | undefined {
  const { meta } = field.state;
  const serverError = messageOf(meta.errorMap.onServer);
  if (serverError)
    return serverError;
  const shouldShow = meta.isTouched || field.form.state.submissionAttempts > 0;
  return shouldShow ? meta.errors.map(messageOf).find(Boolean) : undefined;
}

/**
 * Puts server-side validation errors (`ApiError.fieldErrors`, e.g. "email already taken")
 * onto the matching form fields. Returns true if any field error was applied.
 * The error clears as soon as the user edits that field.
 */
export function applyServerFieldErrors(form: AnyFormApi, error: unknown): boolean {
  if (!(error instanceof ApiError) || !error.fieldErrors)
    return false;

  let applied = false;
  for (const [name, messages] of Object.entries(error.fieldErrors)) {
    if (!(name in form.fieldInfo))
      continue;
    form.setFieldMeta(name, prev => ({ ...prev, errorMap: { ...prev.errorMap, onServer: messages[0] } }));
    applied = true;
  }
  return applied;
}
