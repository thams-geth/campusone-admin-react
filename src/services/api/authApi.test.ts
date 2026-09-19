import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getCurrentUser, login, logout } from '@/services/api/authApi'
import { getAccessToken, setAccessToken } from '@/services/api/httpClient'
import { calls, installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

const AUTH_USER = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Asha Rao',
  email: 'admin@demo-college.test',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  mfaEnabled: false,
}

beforeEach(() => {
  installMockFetch()
  setAccessToken(null)
  sessionStorage.clear()
})

afterEach(() => resetMockFetch())

describe('authApi', () => {
  it('posts credentials to /auth/login and stores the returned access token', async () => {
    mockFetch.post('/auth/login', { body: { user: AUTH_USER, token: 'access-token-1' } })

    const result = await login({ email: AUTH_USER.email, password: 'Passw0rd!' })

    expect(result.user).toEqual(AUTH_USER)
    expect(result.token).toBe('access-token-1')
    expect(getAccessToken()).toBe('access-token-1')

    const call = calls.at(-1)!
    expect(call.method).toBe('POST')
    expect(call.path).toBe('/auth/login')
    expect(call.body).toEqual({ email: AUTH_USER.email, password: 'Passw0rd!' })
  })

  it('includes an mfaCode in the request body when provided', async () => {
    mockFetch.post('/auth/login', { body: { user: AUTH_USER, token: 'access-token-2' } })

    await login({ email: AUTH_USER.email, password: 'Passw0rd!', mfaCode: '123456' })

    expect(calls.at(-1)!.body).toMatchObject({ mfaCode: '123456' })
  })

  it('surfaces a non-2xx login response as an ApiError and leaves the token unset', async () => {
    mockFetch.post('/auth/login', {
      status: 401,
      body: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
    })

    await expect(login({ email: 'nobody@demo-college.test', password: 'wrong' })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid email or password.',
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
    expect(getAccessToken()).toBeNull()
  })

  it('resolves the current user from /auth/me', async () => {
    mockFetch.get('/auth/me', { body: { user: AUTH_USER } })

    const user = await getCurrentUser()

    expect(user).toEqual(AUTH_USER)
    expect(calls.at(-1)).toMatchObject({ method: 'GET', path: '/auth/me' })
  })

  it('surfaces a 401 on /auth/me as a SESSION_EXPIRED ApiError', async () => {
    mockFetch.get('/auth/me', { status: 401, body: { message: 'Session expired.', code: 'SESSION_EXPIRED' } })

    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
  })

  it('logs out and clears the stored access token', async () => {
    mockFetch.post('/auth/login', { body: { user: AUTH_USER, token: 'access-token-3' } })
    await login({ email: AUTH_USER.email, password: 'Passw0rd!' })
    expect(getAccessToken()).toBe('access-token-3')

    mockFetch.post('/auth/logout', { status: 204 })
    await logout()

    expect(getAccessToken()).toBeNull()
    expect(calls.at(-1)).toMatchObject({ method: 'POST', path: '/auth/logout' })
  })

  it('clears the stored access token even if the logout request itself fails', async () => {
    mockFetch.post('/auth/login', { body: { user: AUTH_USER, token: 'access-token-4' } })
    await login({ email: AUTH_USER.email, password: 'Passw0rd!' })

    mockFetch.post('/auth/logout', { status: 500, body: { message: 'Server error', code: 'INTERNAL_ERROR' } })

    await expect(logout()).rejects.toMatchObject({ status: 500 })
    expect(getAccessToken()).toBeNull()
  })
})
