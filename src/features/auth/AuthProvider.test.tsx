import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuth } from '@/features/auth/useAuth'
import { getStoredToken } from '@/features/auth/session'
import { installMockFetch, mockFetch, resetMockFetch } from '@/test/mockFetch'

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}

const TENANT = {
  id: 'tenant-1',
  name: 'Demo College',
  slug: 'demo-college',
  primaryColor: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const SUPER_ADMIN_USER = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Asha Rao',
  email: 'super.admin@demo-college.test',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  mfaEnabled: false,
}

const STAFF_USER = { ...SUPER_ADMIN_USER, id: 'user-2', role: 'STAFF' as const, email: 'staff@demo-college.test' }

const DEPT_ADMIN_USER = {
  ...SUPER_ADMIN_USER,
  id: 'user-3',
  role: 'DEPARTMENT_ADMIN' as const,
  email: 'dept.admin@demo-college.test',
}

beforeEach(() => {
  installMockFetch()
  sessionStorage.clear()
})

afterEach(() => resetMockFetch())

describe('AuthProvider', () => {
  it('starts unauthenticated when there is no stored session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.user).toBeNull()
  })

  it('logs in, stores a token, and exposes the tenant + modules', async () => {
    mockFetch.post('/auth/login', { body: { user: SUPER_ADMIN_USER, token: 'token-1' } })
    mockFetch.get('/institution', { body: TENANT })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: SUPER_ADMIN_USER.email, password: 'Passw0rd!' })
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.user?.role).toBe('SUPER_ADMIN')
    expect(result.current.tenant?.slug).toBe('demo-college')
    expect(getStoredToken()).toEqual(expect.any(String))
  })

  it('rejects a bad login and stays unauthenticated', async () => {
    mockFetch.post('/auth/login', {
      status: 401,
      body: { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await expect(
        result.current.login({ email: SUPER_ADMIN_USER.email, password: 'wrong' }),
      ).rejects.toThrow()
    })

    expect(result.current.status).toBe('unauthenticated')
  })

  it('clears the session on logout', async () => {
    mockFetch.post('/auth/login', { body: { user: STAFF_USER, token: 'token-2' } })
    mockFetch.get('/institution', { body: TENANT })
    mockFetch.post('/auth/logout', { status: 204 })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: STAFF_USER.email, password: 'Passw0rd!' })
    })
    expect(result.current.status).toBe('authenticated')

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(getStoredToken()).toBeNull()
  })

  it('hasRole/hasModule reflect the signed-in user and tenant', async () => {
    mockFetch.post('/auth/login', { body: { user: DEPT_ADMIN_USER, token: 'token-3' } })
    mockFetch.get('/institution', { body: TENANT })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: DEPT_ADMIN_USER.email, password: 'Passw0rd!' })
    })

    expect(result.current.hasRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN')).toBe(true)
    expect(result.current.hasRole('FACULTY')).toBe(false)
    // CORE is always on regardless of the (currently empty) tenant modules list.
    expect(result.current.hasModule('core')).toBe(true)
    expect(result.current.hasModule('finance')).toBe(false)
  })
})
