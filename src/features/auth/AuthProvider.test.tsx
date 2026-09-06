import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuth } from '@/features/auth/useAuth'
import { getStoredToken } from '@/features/auth/session'

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('starts unauthenticated when there is no stored session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.user).toBeNull()
  })

  it('logs in, stores a token, and exposes the tenant + modules', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: 'super.admin@aurora.edu', password: 'Passw0rd!' })
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.user?.role).toBe('SUPER_ADMIN')
    expect(result.current.tenant?.slug).toBe('aurora')
    expect(getStoredToken()).toEqual(expect.any(String))
  })

  it('rejects a bad login and stays unauthenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await expect(
        result.current.login({ email: 'super.admin@aurora.edu', password: 'wrong' }),
      ).rejects.toThrow()
    })

    expect(result.current.status).toBe('unauthenticated')
  })

  it('clears the session on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: 'staff@aurora.edu', password: 'Passw0rd!' })
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
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))

    await act(async () => {
      await result.current.login({ email: 'dept.admin@aurora.edu', password: 'Passw0rd!' })
    })

    expect(result.current.hasRole('DEPARTMENT_ADMIN', 'SUPER_ADMIN')).toBe(true)
    expect(result.current.hasRole('FACULTY')).toBe(false)
    expect(result.current.hasModule('core')).toBe(true)
    expect(result.current.hasModule('finance')).toBe(false)
  })
})
