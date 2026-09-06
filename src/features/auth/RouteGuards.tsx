import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Result } from 'antd'
import type { Role } from '@/types/user'
import type { ModuleId } from '@/types/tenant'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

/** Shape of the redirect state `RequireAuth` attaches when bouncing to /login. */
export interface LoginRedirectState {
  from?: { pathname: string }
}

/** Blocks a route unless the user has an active session. */
export function RequireAuth({ children }: PropsWithChildren) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') return <FullPageSpinner />

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

/**
 * Blocks a route unless the user's role is in the allow-list. Deliberately
 * explicit per-route rather than an implicit role hierarchy — for
 * permission checks, "spell it out" beats "infer it" as a class of bug
 * to avoid. Per CLAUDE.md this is always "role Y inside the current
 * tenant", never a bare global role check — `useAuth().user.role` is
 * already scoped to the authenticated tenant, so that invariant holds
 * as long as callers only read role off this context.
 */
export function RequireRole({ roles, children }: PropsWithChildren<{ roles: Role[] }>) {
  const { hasRole } = useAuth()

  if (!hasRole(...roles)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You don't have permission to view this page."
      />
    )
  }

  return children
}

/** Blocks a route unless the tenant has the given module enabled. */
export function RequireModule({ moduleId, children }: PropsWithChildren<{ moduleId: ModuleId }>) {
  const { hasModule } = useAuth()

  if (!hasModule(moduleId)) {
    return (
      <Result
        status="warning"
        title="Module not enabled"
        subTitle="This feature isn't part of your college's current plan."
      />
    )
  }

  return children
}
