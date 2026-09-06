import { ApiError, type PaginatedResponse, type PaginationParams } from '@/types/common'
import type { Department, DepartmentInput } from '@/types/department'
import { networkDelay } from '@/services/mock/latency'
import { departmentsTable, studentsTable } from '@/services/mock/db'
import { TENANT_ID } from '@/services/mock/db/tenant'

export interface ListDepartmentsParams extends PaginationParams {
  status?: Department['status']
}

export async function listDepartments(
  params: ListDepartmentsParams = {},
): Promise<PaginatedResponse<Department>> {
  await networkDelay()
  const { status, ...pagination } = params
  return departmentsTable.list(pagination, {
    searchFields: ['name', 'code', 'headOfDepartment'],
    filter: (dept) => (status ? dept.status === status : true),
  })
}

export async function getDepartment(id: string): Promise<Department> {
  await networkDelay(150)
  return departmentsTable.getByIdOrThrow(id, 'Department')
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  await networkDelay()
  assertUniqueCode(input.code)

  const now = new Date().toISOString()
  const department: Department = {
    id: crypto.randomUUID(),
    tenantId: TENANT_ID,
    studentCount: 0,
    facultyCount: 0,
    createdAt: now,
    updatedAt: now,
    ...input,
  }
  return departmentsTable.insert(department)
}

export async function updateDepartment(id: string, input: DepartmentInput): Promise<Department> {
  await networkDelay()
  assertUniqueCode(input.code, id)
  return departmentsTable.update(id, { ...input, updatedAt: new Date().toISOString() })
}

export async function deleteDepartment(id: string): Promise<void> {
  await networkDelay()
  const hasStudents = studentsTable.some((s) => s.departmentId === id)
  if (hasStudents) {
    throw new ApiError(
      'This department has students assigned to it. Reassign or remove them first.',
      409,
      'DEPARTMENT_IN_USE',
    )
  }
  departmentsTable.remove(id)
}

function assertUniqueCode(code: string, excludeId?: string) {
  const normalized = code.trim().toLowerCase()
  const exists = departmentsTable.some(
    (d) => d.id !== excludeId && d.code.trim().toLowerCase() === normalized,
  )
  if (exists) {
    throw new ApiError(`Department code "${code}" is already in use.`, 409, 'DUPLICATE_CODE')
  }
}
