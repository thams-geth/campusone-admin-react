import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Role } from '@/types/user'
import type { ModuleId } from '@/types/tenant'
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  type LoginCredentials,
} from '@/services/api/authApi'
import { getCurrentTenant, getTenantModules } from '@/services/api/tenantApi'
import { getStoredToken } from '@/features/auth/session'
import { registerSessionExpiredHandler } from '@/services/authEvents'
import { AuthContext, initialAuthState, type AuthContextValue, type AuthState } from '@/features/auth/authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialAuthState)

  useEffect(() => {
    let cancelled = false

    async function rehydrate() {
      const token = getStoredToken()
      if (!token) {
        setState({ ...initialAuthState, status: 'unauthenticated' })
        return
      }

      setState((prev) => ({ ...prev, status: 'loading' }))
      try {
        const user = await getCurrentUser()
        const [tenant, modules] = await Promise.all([getCurrentTenant(), getTenantModules()])
        if (!cancelled) setState({ status: 'authenticated', user, tenant, modules })
      } catch {
        if (!cancelled) setState({ ...initialAuthState, status: 'unauthenticated' })
      }
    }

    void rehydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async () => {
    setState({ ...initialAuthState, status: 'unauthenticated' })
    // Best-effort — the session is already cleared locally either way.
    await apiLogout().catch(() => undefined)
  }, [])

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      void logout()
    })
  }, [logout])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user } = await apiLogin(credentials)
    const [tenant, modules] = await Promise.all([getCurrentTenant(), getTenantModules()])
    setState({ status: 'authenticated', user, tenant, modules })
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => !!state.user && roles.includes(state.user.role),
    [state.user],
  )

  const hasModule = useCallback(
    (moduleId: ModuleId) =>
      moduleId === 'core' || state.modules.some((m) => m.moduleId === moduleId && m.enabled),
    [state.modules],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, hasRole, hasModule }),
    [state, login, logout, hasRole, hasModule],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
