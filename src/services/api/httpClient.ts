import { ApiError } from '@/types/common'
import { notifySessionExpired } from '@/services/authEvents'
import { clearStoredToken, getStoredToken, setStoredToken } from '@/features/auth/session'

/**
 * campusone-api mounts everything under /api/v1 (see the backend's
 * src/app.ts) except /health*. Override via VITE_API_BASE_URL for
 * anything other than the local dev server.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api/v1'

/**
 * Access token lives in memory, seeded from sessionStorage on load so a
 * reload survives without forcing a re-login. The refresh token never
 * touches JS at all — it's an httpOnly cookie the browser attaches
 * automatically (`credentials: 'include'`) and only the backend can read.
 */
let accessToken: string | null = getStoredToken()

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (token) setStoredToken(token)
  else clearStoredToken()
}

export function getAccessToken(): string | null {
  return accessToken
}

type QueryValue = string | number | boolean | undefined | null

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  /**
   * Skip the automatic refresh-and-retry on a 401. Used by login/refresh
   * themselves so a bad password doesn't get mistaken for an expired
   * session and trigger a spurious global logout.
   */
  skipAuthRetry?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    // Sends the httpOnly refreshToken cookie cross-origin (localhost:5173 -> localhost:4000 in dev).
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

/** Concurrent 401s during the same expiry all wait on one /auth/refresh call instead of racing. */
let refreshInFlight: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await rawRequest('/auth/refresh', { method: 'POST', skipAuthRetry: true })
        if (!res.ok) return false
        const data = (await res.json()) as { token: string }
        setAccessToken(data.token)
        return true
      } catch {
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { message?: string; code?: string; details?: Record<string, string[] | undefined> } = {}
  try {
    body = await res.json()
  } catch {
    // Non-JSON error body (e.g. an upstream proxy/504 page) — fall back below.
  }
  return new ApiError(body.message ?? `Request failed with status ${res.status}`, res.status, body.code ?? 'UNKNOWN_ERROR', body.details)
}

/** The shared 401-refresh-and-retry dance, used by every request shape (JSON or raw). */
async function requestWithRetry(path: string, options: RequestOptions): Promise<Response> {
  let res = await rawRequest(path, options)

  if (res.status === 401 && !options.skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      res = await rawRequest(path, options)
    } else {
      setAccessToken(null)
      notifySessionExpired()
      throw await toApiError(res)
    }
  }

  if (!res.ok) {
    throw await toApiError(res)
  }

  return res
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await requestWithRetry(path, options)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** For the rare non-JSON response (e.g. a CSV export) — same auth/retry handling, raw text back. */
async function requestText(path: string, options: RequestOptions = {}): Promise<string> {
  const res = await requestWithRetry(path, options)
  return res.text()
}

export const http = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { method: 'GET', query }),
  getText: (path: string, query?: RequestOptions['query']) => requestText(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'skipAuthRetry'>) =>
    request<T>(path, { method: 'POST', body, ...options }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
