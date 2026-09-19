import type { PaginatedResponse, PaginationParams } from '@/types/common'
import type { Department, DepartmentInput } from '@/types/department'
import { http } from '@/services/api/httpClient'

export interface ListDepartmentsParams extends PaginationParams {
  status?: Department['status']
}

/**
 * The API's DepartmentStatus enum is uppercase (ACTIVE/INACTIVE); the
 * frontend's EntityStatus stays lowercase to match the rest of the UI
 * (labels, existing Select options). Translate at this one boundary
 * rather than pushing the API's casing into every component.
 */
function toWireStatus(status: Department['status']): string {
  return status.toUpperCase()
}

function fromWireDepartment(dept: Record<string, unknown> & { status: string }): Department {
  return { ...dept, status: dept.status.toLowerCase() } as Department
}

export async function listDepartments(
  params: ListDepartmentsParams = {},
): Promise<PaginatedResponse<Department>> {
  const { status, page, pageSize, search } = params
  const result = await http.get<PaginatedResponse<Record<string, unknown> & { status: string }>>('/departments', {
    page,
    pageSize,
    search,
    status: status ? toWireStatus(status) : undefined,
  })
  return { ...result, data: result.data.map(fromWireDepartment) }
}

export async function getDepartment(id: string): Promise<Department> {
  const dept = await http.get<Record<string, unknown> & { status: string }>(`/departments/${id}`)
  return fromWireDepartment(dept)
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const dept = await http.post<Record<string, unknown> & { status: string }>('/departments', {
    ...input,
    status: toWireStatus(input.status),
  })
  return fromWireDepartment(dept)
}

export async function updateDepartment(id: string, input: DepartmentInput): Promise<Department> {
  const dept = await http.put<Record<string, unknown> & { status: string }>(`/departments/${id}`, {
    ...input,
    status: toWireStatus(input.status),
  })
  return fromWireDepartment(dept)
}

export async function deleteDepartment(id: string): Promise<void> {
  await http.delete<void>(`/departments/${id}`)
}
