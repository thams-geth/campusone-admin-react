import { http } from '@/services/api/httpClient'

/**
 * Mounted at the /api/v1 root (see campusone-api's app.ts) — its own
 * admin surface rather than one resource prefix: /roles, /permissions,
 * /users/:id/role.
 */
export interface Role {
  id: string
  name: string
  isSystem: boolean
  /** Permission keys granted to this role, e.g. "STUDENT_READ". */
  permissions: string[]
}

export interface Permission {
  key: string
  description: string
}

export interface AssignRoleInput {
  roleName: string
}

export interface AssignRoleResult {
  userId: string
  role: string
}

export async function listRoles(): Promise<Role[]> {
  return http.get<Role[]>('/roles')
}

export async function listPermissions(): Promise<Permission[]> {
  return http.get<Permission[]>('/permissions')
}

export async function assignRole(userId: string, input: AssignRoleInput): Promise<AssignRoleResult> {
  return http.post<AssignRoleResult>(`/users/${userId}/role`, input)
}
