import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's SubjectType enum exactly — no lowercase translation. */
export type SubjectType = 'CORE' | 'ELECTIVE' | 'LAB' | 'PROJECT' | 'SEMINAR' | 'PRACTICAL'

export interface Subject {
  id: string
  tenantId: string
  programId: string
  semesterNumber: number
  code: string
  name: string
  credits: number
  type: SubjectType
  facultyId: string | null
  createdAt: string
  updatedAt: string
}

export interface SubjectInput {
  programId: string
  semesterNumber: number
  code: string
  name: string
  credits: number
  /** Defaults to `CORE` server-side when omitted. */
  type?: SubjectType
  facultyId?: string
}

export interface ListSubjectsParams extends PaginationParams {
  programId?: string
  semesterNumber?: number
  type?: SubjectType
}

export async function listSubjects(params: ListSubjectsParams = {}): Promise<PaginatedResponse<Subject>> {
  const { page, pageSize, search, programId, semesterNumber, type } = params
  return http.get<PaginatedResponse<Subject>>('/subjects', { page, pageSize, search, programId, semesterNumber, type })
}

export async function getSubject(id: string): Promise<Subject> {
  return http.get<Subject>(`/subjects/${id}`)
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  return http.post<Subject>('/subjects', input)
}

export async function updateSubject(id: string, input: SubjectInput): Promise<Subject> {
  return http.put<Subject>(`/subjects/${id}`, input)
}

export async function deleteSubject(id: string): Promise<void> {
  await http.delete<void>(`/subjects/${id}`)
}
