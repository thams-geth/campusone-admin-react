import { ApiError } from '@/types/common'

/** Surfaces a server-provided message for known API errors, falling back to a generic one otherwise. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}
