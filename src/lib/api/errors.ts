import { isAxiosError, isCancel } from 'axios';
import { ZodError } from 'zod';

export type ApiErrorKind
  = | 'network' // no connection / DNS / server unreachable
    | 'timeout'
    | 'cancelled' // request aborted (e.g. screen unmounted) — never shown to users
    | 'unauthorized' // 401
    | 'forbidden' // 403
    | 'not_found' // 404
    | 'conflict' // 409
    | 'validation' // 400/422 — may carry fieldErrors
    | 'rate_limited' // 429
    | 'server' // 5xx
    | 'parse' // response didn't match the expected schema
    | 'unknown';

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'No internet connection. Check your network and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  cancelled: 'Request cancelled.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You don\'t have permission to do that.',
  not_found: 'We couldn\'t find what you were looking for.',
  conflict: 'This was changed by someone else. Refresh and try again.',
  validation: 'Some information is invalid. Please check and try again.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again.',
  parse: 'We received an unexpected response. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

/**
 * The ONE error type features see. Every failed request (axios, timeout, offline, bad JSON shape)
 * is normalised into this by `toApiError`, so screens never inspect raw axios errors.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Machine-readable code from the server if provided, else the kind. */
  readonly code: string;
  /** Field → messages, for mapping server validation errors onto form fields. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(options: { kind: ApiErrorKind; message?: string; status?: number; code?: string; fieldErrors?: Record<string, string[]>; cause?: unknown }) {
    super(options.message || DEFAULT_MESSAGES[options.kind], { cause: options.cause });
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code ?? options.kind;
    this.fieldErrors = options.fieldErrors;
  }

  /** Offline or unreachable — worth retrying when connectivity returns. */
  get isNetworkError() {
    return this.kind === 'network' || this.kind === 'timeout';
  }

  /** 4xx: retrying the same request won't help. */
  get isClientError() {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401)
    return 'unauthorized';
  if (status === 403)
    return 'forbidden';
  if (status === 404)
    return 'not_found';
  if (status === 409)
    return 'conflict';
  if (status === 400 || status === 422)
    return 'validation';
  if (status === 429)
    return 'rate_limited';
  if (status >= 500)
    return 'server';
  return 'unknown';
}

type ErrorBody = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  errors?: unknown;
  fieldErrors?: unknown;
};

/**
 * Extracts field errors from the common backend shapes:
 * - `{ errors: { email: ['Taken'] } }` / `{ fieldErrors: { email: 'Taken' } }`
 * - `{ errors: [{ field: 'email', message: 'Taken' }] }` (also `path` / `property`)
 * Adapt this function if your backend uses something else.
 */
function extractFieldErrors(body: ErrorBody): Record<string, string[]> | undefined {
  const source = body.fieldErrors ?? body.errors;
  const result: Record<string, string[]> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (item && typeof item === 'object') {
        const { field, path, property, message } = item as Record<string, unknown>;
        const key = [field, path, property].find(k => typeof k === 'string' || Array.isArray(k));
        const name = Array.isArray(key) ? key.join('.') : (key as string | undefined);
        if (name && typeof message === 'string')
          (result[name] ??= []).push(message);
      }
    }
  }
  else if (source && typeof source === 'object') {
    for (const [name, value] of Object.entries(source)) {
      const messages = (Array.isArray(value) ? value : [value]).filter((m): m is string => typeof m === 'string');
      if (messages.length)
        result[name] = messages;
    }
  }

  return Object.keys(result).length ? result : undefined;
}

function serverMessage(body: ErrorBody): string | undefined {
  if (typeof body.message === 'string')
    return body.message;
  if (Array.isArray(body.message) && typeof body.message[0] === 'string')
    return body.message[0]; // e.g. NestJS validation
  if (typeof body.error === 'string')
    return body.error;
  return undefined;
}

/** Normalises anything thrown during a request into an `ApiError`. Idempotent. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError)
    return error;

  if (isCancel(error))
    return new ApiError({ kind: 'cancelled', cause: error });

  if (error instanceof ZodError)
    return new ApiError({ kind: 'parse', cause: error });

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
      return new ApiError({ kind: 'timeout', cause: error });
    if (error.code === 'ERR_CANCELED')
      return new ApiError({ kind: 'cancelled', cause: error });

    const response = error.response;
    if (!response)
      return new ApiError({ kind: 'network', cause: error });

    const body: ErrorBody = response.data && typeof response.data === 'object' ? response.data : {};
    const kind = kindFromStatus(response.status);
    // Show server messages for client errors (they're usually meant for users); hide 5xx details.
    const message = kind === 'server' ? undefined : serverMessage(body);

    return new ApiError({
      kind,
      status: response.status,
      message,
      code: typeof body.code === 'string' ? body.code : undefined,
      fieldErrors: extractFieldErrors(body),
      cause: error,
    });
  }

  return new ApiError({ kind: 'unknown', message: error instanceof Error ? error.message : undefined, cause: error });
}
