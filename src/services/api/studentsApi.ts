import type { PaginatedResponse, PaginationParams } from '@/types/common'
import type { Student, StudentInput, StudentStatus, StudentSummary360 } from '@/types/student'
import { http } from '@/services/api/httpClient'

export interface ListStudentsParams extends PaginationParams {
  departmentId?: string
  status?: StudentStatus
}

/**
 * The API's Gender/StudentStatus enums are uppercase; the frontend keeps
 * them lowercase to match the rest of the UI (labels, existing form
 * options). Translate at this one boundary rather than pushing the
 * API's casing into every component.
 */
function toWireStudent(input: StudentInput): Record<string, unknown> {
  return { ...input, gender: input.gender.toUpperCase(), status: input.status.toUpperCase() }
}

function fromWireStudent(student: Record<string, unknown> & { gender: string; status: string }): Student {
  return { ...student, gender: student.gender.toLowerCase(), status: student.status.toLowerCase() } as Student
}

export async function listStudents(
  params: ListStudentsParams = {},
): Promise<PaginatedResponse<Student>> {
  const { departmentId, status, page, pageSize, search } = params
  const result = await http.get<PaginatedResponse<Record<string, unknown> & { gender: string; status: string }>>(
    '/students',
    { page, pageSize, search, departmentId, status: status ? status.toUpperCase() : undefined },
  )
  return { ...result, data: result.data.map(fromWireStudent) }
}

export async function getStudent(id: string): Promise<Student> {
  const student = await http.get<Record<string, unknown> & { gender: string; status: string }>(`/students/${id}`)
  return fromWireStudent(student)
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const student = await http.post<Record<string, unknown> & { gender: string; status: string }>(
    '/students',
    toWireStudent(input),
  )
  return fromWireStudent(student)
}

export async function updateStudent(id: string, input: StudentInput): Promise<Student> {
  const student = await http.put<Record<string, unknown> & { gender: string; status: string }>(
    `/students/${id}`,
    toWireStudent(input),
  )
  return fromWireStudent(student)
}

export async function deleteStudent(id: string): Promise<void> {
  await http.delete<void>(`/students/${id}`)
}

/** Read-only cross-module aggregation (attendance, fees, hostel/transport, library, documents, leave, ...). */
export async function getStudent360(id: string): Promise<StudentSummary360> {
  return http.get<StudentSummary360>(`/students/${id}/360`)
}
