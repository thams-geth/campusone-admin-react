import type { EntityStatus } from '@/types/common'

export type Gender = 'male' | 'female' | 'other'

export type StudentStatus = EntityStatus | 'alumni'

export interface Student {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  gender: Gender
  dateOfBirth: string
  admissionDate: string
  status: StudentStatus
  guardianName?: string
  guardianPhone?: string
  address?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface StudentInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  gender: Gender
  dateOfBirth: string
  admissionDate: string
  status: StudentStatus
  guardianName?: string
  guardianPhone?: string
  address?: string
}
