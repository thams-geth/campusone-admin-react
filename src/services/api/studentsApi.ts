import { ApiError, type PaginatedResponse, type PaginationParams } from '@/types/common'
import type { Student, StudentInput, StudentStatus } from '@/types/student'
import { networkDelay } from '@/services/mock/latency'
import { departmentsTable, studentsTable } from '@/services/mock/db'
import { TENANT_ID } from '@/services/mock/db/tenant'

export interface ListStudentsParams extends PaginationParams {
  departmentId?: string
  status?: StudentStatus
}

export async function listStudents(
  params: ListStudentsParams = {},
): Promise<PaginatedResponse<Student>> {
  await networkDelay()
  const { departmentId, status, ...pagination } = params
  return studentsTable.list(pagination, {
    searchFields: ['firstName', 'lastName', 'email', 'rollNumber'],
    filter: (student) =>
      (departmentId ? student.departmentId === departmentId : true) &&
      (status ? student.status === status : true),
  })
}

export async function getStudent(id: string): Promise<Student> {
  await networkDelay(150)
  return studentsTable.getByIdOrThrow(id, 'Student')
}

export async function createStudent(input: StudentInput): Promise<Student> {
  await networkDelay()
  assertDepartmentUsable(input.departmentId)
  assertUniqueEmail(input.email)
  assertUniqueRollNumber(input.rollNumber)

  const now = new Date().toISOString()
  const student: Student = {
    id: crypto.randomUUID(),
    tenantId: TENANT_ID,
    createdAt: now,
    updatedAt: now,
    ...input,
  }
  return studentsTable.insert(student)
}

export async function updateStudent(id: string, input: StudentInput): Promise<Student> {
  await networkDelay()
  assertDepartmentUsable(input.departmentId)
  assertUniqueEmail(input.email, id)
  assertUniqueRollNumber(input.rollNumber, id)
  return studentsTable.update(id, { ...input, updatedAt: new Date().toISOString() })
}

export async function deleteStudent(id: string): Promise<void> {
  await networkDelay()
  studentsTable.remove(id)
}

function assertDepartmentUsable(departmentId: string) {
  const department = departmentsTable.getById(departmentId)
  if (!department) {
    throw new ApiError('Selected department does not exist.', 422, 'INVALID_DEPARTMENT')
  }
  if (department.status !== 'active') {
    throw new ApiError(
      `Department "${department.name}" is inactive and cannot accept new students.`,
      422,
      'DEPARTMENT_INACTIVE',
    )
  }
}

function assertUniqueEmail(email: string, excludeId?: string) {
  const normalized = email.trim().toLowerCase()
  const exists = studentsTable.some(
    (s) => s.id !== excludeId && s.email.trim().toLowerCase() === normalized,
  )
  if (exists) {
    throw new ApiError(`Email "${email}" is already registered to another student.`, 409, 'DUPLICATE_EMAIL')
  }
}

function assertUniqueRollNumber(rollNumber: string, excludeId?: string) {
  const normalized = rollNumber.trim().toLowerCase()
  const exists = studentsTable.some(
    (s) => s.id !== excludeId && s.rollNumber.trim().toLowerCase() === normalized,
  )
  if (exists) {
    throw new ApiError(`Roll number "${rollNumber}" is already in use.`, 409, 'DUPLICATE_ROLL_NUMBER')
  }
}
