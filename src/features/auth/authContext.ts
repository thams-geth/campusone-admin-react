import { createContext } from 'react'
import type { AuthUser, Role } from '@/types/user'
import type { ModuleId, Tenant, TenantModule } from '@/types/tenant'
import type { LoginCredentials } from '@/services/api/authApi'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  tenant: Tenant | null
  modules: TenantModule[]
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: Role[]) => boolean
  hasModule: (moduleId: ModuleId) => boolean
}

export const initialAuthState: AuthState = {
  status: 'idle',
  user: null,
  tenant: null,
  modules: [],
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
