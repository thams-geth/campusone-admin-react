import { vi } from 'vitest'

/**
 * A thin router over `vi.fn()` that stands in for the real campusone-api
 * during tests — `httpClient.ts` calls the global `fetch`, so stubbing it
 * here is enough to exercise every layer above it (service functions,
 * hooks, pages) without a live backend. Deliberately minimal: register a
 * response (or a handler) per method+path, call `installMockFetch()` in
 * `beforeEach`, and `resetMockFetch()` in `afterEach`.
 */

export interface MockFetchContext {
  method: string
  /** Query params parsed from the request URL. */
  query: URLSearchParams
  /** Path params extracted from `:name` segments in the registered path pattern. */
  params: Record<string, string>
  /** Parsed JSON request body, or undefined if none was sent. */
  body: unknown
}

export interface MockFetchResult {
  /** Defaults to 200, or 204 when `body` is omitted. */
  status?: number
  body?: unknown
}

type Handler = (ctx: MockFetchContext) => MockFetchResult | Promise<MockFetchResult>

interface Route {
  method: string
  segments: string[]
  handler: Handler
}

export interface RecordedCall {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
}

let routes: Route[] = []

/** Every request made while the mock is installed, in order. */
export const calls: RecordedCall[] = []

/**
 * httpClient.ts prefixes every request with the API base URL (defaulting
 * to `http://localhost:4000/api/v1`, overridable via VITE_API_BASE_URL —
 * same default it uses). Routes are registered relative to that base
 * (e.g. `/departments`), so strip the base path before matching.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api/v1'
const basePath = new URL(API_BASE_URL).pathname.replace(/\/$/, '')

function stripBasePath(pathname: string): string {
  if (basePath && pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || '/'
  }
  return pathname
}

function toSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function matchRoute(route: Route, method: string, pathname: string): Record<string, string> | null {
  if (route.method !== method) return null
  const pathSegments = toSegments(pathname)
  if (pathSegments.length !== route.segments.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < route.segments.length; i++) {
    const segment = route.segments[i]
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = pathSegments[i]
    } else if (segment !== pathSegments[i]) {
      return null
    }
  }
  return params
}

function register(method: string, path: string, response: MockFetchResult | Handler): void {
  const handler: Handler = typeof response === 'function' ? response : () => response
  // Most-recently-registered route wins, so a test can override a route
  // registered by a shared setup helper earlier in the same test.
  routes.unshift({ method, segments: toSegments(path), handler })
}

/**
 * Register a canned response (or a handler function, for stateful fixtures
 * like "list reflects what was just created") for one method+path. `path`
 * may include `:param` segments, e.g. `/students/:id`.
 */
export const mockFetch = {
  get: (path: string, response: MockFetchResult | Handler) => register('GET', path, response),
  post: (path: string, response: MockFetchResult | Handler) => register('POST', path, response),
  put: (path: string, response: MockFetchResult | Handler) => register('PUT', path, response),
  patch: (path: string, response: MockFetchResult | Handler) => register('PATCH', path, response),
  delete: (path: string, response: MockFetchResult | Handler) => register('DELETE', path, response),
}

/** Stubs `global.fetch`. Call once per test, typically in `beforeEach`. */
export function installMockFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input.toString())
      const method = (init?.method ?? 'GET').toUpperCase()
      const pathname = stripBasePath(url.pathname)

      let body: unknown
      if (typeof init?.body === 'string') {
        try {
          body = JSON.parse(init.body)
        } catch {
          body = init.body
        }
      }

      calls.push({ method, path: pathname, query: url.searchParams, body })

      for (const route of routes) {
        const params = matchRoute(route, method, pathname)
        if (!params) continue

        const result = await route.handler({ method, query: url.searchParams, params, body })
        const status = result.status ?? (result.body === undefined ? 204 : 200)

        if (status === 204 || result.body === undefined) {
          return new Response(null, { status })
        }
        return new Response(JSON.stringify(result.body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`mockFetch: no route registered for ${method} ${pathname}`)
    }),
  )
}

/** Clears registered routes and recorded calls. Call in `afterEach`. */
export function resetMockFetch(): void {
  routes = []
  calls.length = 0
  vi.unstubAllGlobals()
}
