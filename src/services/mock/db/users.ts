import type { AuthUser } from '@/types/user'
import { TENANT_ID } from '@/services/mock/db/tenant'

/**
 * MOCK ONLY. This file exists purely because there is no backend yet —
 * shipping plaintext credentials in a client bundle is never acceptable
 * once a real auth service exists. Delete this file the moment
 * `authApi.login` is wired to a real endpoint; passwords must live only
 * in a backend store, hashed (argon2/bcrypt), never in frontend code.
 */
interface MockUserRecord extends AuthUser {
  password: string
}

export const mockUsers: MockUserRecord[] = [
  {
    id: 'user-super-admin',
    tenantId: TENANT_ID,
    name: 'Ananya Rao',
    email: 'super.admin@aurora.edu',
    role: 'SUPER_ADMIN',
    isActive: true,
    password: 'Passw0rd!',
  },
  {
    id: 'user-college-admin',
    tenantId: TENANT_ID,
    name: 'Vikram Shah',
    email: 'college.admin@aurora.edu',
    role: 'COLLEGE_ADMIN',
    isActive: true,
    password: 'Passw0rd!',
  },
  {
    id: 'user-dept-admin',
    tenantId: TENANT_ID,
    name: 'Priya Nair',
    email: 'dept.admin@aurora.edu',
    role: 'DEPARTMENT_ADMIN',
    isActive: true,
    password: 'Passw0rd!',
  },
  {
    id: 'user-faculty',
    tenantId: TENANT_ID,
    name: 'Rahul Menon',
    email: 'faculty@aurora.edu',
    role: 'FACULTY',
    isActive: true,
    password: 'Passw0rd!',
  },
  {
    id: 'user-staff',
    tenantId: TENANT_ID,
    name: 'Sneha Iyer',
    email: 'staff@aurora.edu',
    role: 'STAFF',
    isActive: true,
    password: 'Passw0rd!',
  },
]

export function findUserByEmail(email: string): MockUserRecord | undefined {
  const needle = email.trim().toLowerCase()
  return mockUsers.find((u) => u.email.toLowerCase() === needle)
}

export function findUserById(id: string): MockUserRecord | undefined {
  return mockUsers.find((u) => u.id === id)
}

export function toPublicUser(record: MockUserRecord): AuthUser {
  const { password: _password, ...publicUser } = record
  return publicUser
}
