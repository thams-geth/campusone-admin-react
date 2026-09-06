import { ApiError } from '@/types/common'
import type { AuthUser } from '@/types/user'
import { networkDelay } from '@/services/mock/latency'
import { findUserByEmail, findUserById, toPublicUser } from '@/services/mock/db/users'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResult {
  user: AuthUser
  token: string
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 30 * 1000

/**
 * Opaque server-side session store, keyed by token. The token itself
 * carries no information — it's just a lookup key — so it mirrors how a
 * real backend session/opaque-token model works, rather than a client
 * decodable JWT. Lives only in memory: refreshing the page loses it,
 * which is why `sessionStorage` + re-login-on-refresh is acceptable here.
 */
const sessions = new Map<string, { userId: string; expiresAt: number }>()

/**
 * Client-side lockout is UX only — it stops a script from hammering the
 * mock login in a demo, nothing more. An attacker controls their own
 * client, so real throttling/lockout MUST be enforced server-side
 * (e.g. per-IP + per-account rate limiting) once a backend exists.
 */
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>()

export async function login({ email, password }: LoginCredentials): Promise<LoginResult> {
  await networkDelay()

  const key = email.trim().toLowerCase()
  const attempt = failedAttempts.get(key)
  if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
    const secondsLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 1000)
    throw new ApiError(
      `Too many failed attempts. Try again in ${secondsLeft}s.`,
      429,
      'ACCOUNT_LOCKED',
    )
  }

  const record = findUserByEmail(email)
  const valid = record && record.password === password && record.isActive

  if (!valid) {
    const next = { count: (attempt?.count ?? 0) + 1, lockedUntil: attempt?.lockedUntil }
    if (next.count >= MAX_FAILED_ATTEMPTS) {
      next.lockedUntil = Date.now() + LOCKOUT_MS
      next.count = 0
    }
    failedAttempts.set(key, next)
    // Intentionally generic — never reveal whether the email exists.
    throw new ApiError('Invalid email or password.', 401, 'INVALID_CREDENTIALS')
  }

  failedAttempts.delete(key)

  const token = crypto.randomUUID()
  sessions.set(token, { userId: record.id, expiresAt: Date.now() + SESSION_TTL_MS })

  return { user: toPublicUser(record), token }
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  await networkDelay(150)

  const session = sessions.get(token)
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token)
    throw new ApiError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')
  }

  const record = findUserById(session.userId)
  if (!record || !record.isActive) {
    sessions.delete(token)
    throw new ApiError('Account is no longer active.', 401, 'ACCOUNT_INACTIVE')
  }

  return toPublicUser(record)
}

export async function logout(token: string): Promise<void> {
  await networkDelay(100)
  sessions.delete(token)
}
