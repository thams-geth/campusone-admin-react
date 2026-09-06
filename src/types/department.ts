import type { EntityStatus } from '@/types/common'

export interface Department {
  id: string
  tenantId: string
  name: string
  code: string
  headOfDepartment?: string
  description?: string
  status: EntityStatus
  studentCount: number
  facultyCount: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentInput {
  name: string
  code: string
  headOfDepartment?: string
  description?: string
  status: EntityStatus
}
