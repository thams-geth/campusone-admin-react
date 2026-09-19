/**
 * Every permission check is "does user X have role Y inside tenant Z" —
 * roles below (other than PLATFORM_ADMIN) only ever mean something in
 * the context of the current tenant, never globally.
 */
export type Role =
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN'
  | 'COLLEGE_ADMIN'
  | 'DEPARTMENT_ADMIN'
  | 'HOD'
  | 'EXAM_ADMIN'
  | 'FACULTY'
  | 'STAFF'
  | 'STUDENT'
  | 'PARENT'

export interface AuthUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  isActive: boolean
  mfaEnabled: boolean
}
