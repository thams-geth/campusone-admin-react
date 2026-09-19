import type { AuthUser } from '@/types/user'
import { http, setAccessToken } from '@/services/api/httpClient'

export interface LoginCredentials {
  email: string
  password: string
  /** Required on a second attempt when the first response is MFA_REQUIRED. */
  mfaCode?: string
}

export interface LoginResult {
  user: AuthUser
  token: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const result = await http.post<LoginResult>('/auth/login', credentials, { skipAuthRetry: true })
  setAccessToken(result.token)
  return result
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { user } = await http.get<{ user: AuthUser }>('/auth/me')
  return user
}

export async function logout(): Promise<void> {
  try {
    await http.post<void>('/auth/logout')
  } finally {
    setAccessToken(null)
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await http.post<void>('/auth/change-password', { currentPassword, newPassword })
}

export interface ForgotPasswordResult {
  message: string
  /** Only present outside production — see campusone-api's auth.service.ts. */
  resetToken?: string
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  return http.post<ForgotPasswordResult>('/auth/forgot-password', { email }, { skipAuthRetry: true })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await http.post<void>('/auth/reset-password', { token, newPassword }, { skipAuthRetry: true })
}
