import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's AcademicYearStatus enum exactly — no lowercase translation. */
export type AcademicYearStatus = 'ACTIVE' | 'CLOSED'

export interface AcademicYear {
  id: string
  tenantId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: AcademicYearStatus
  createdAt: string
  updatedAt: string
}

export interface AcademicYearInput {
  name: string
  startDate: string
  endDate: string
  /** Defaults to `false` server-side when omitted. */
  isCurrent?: boolean
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: AcademicYearStatus
}

export interface ListAcademicYearsParams extends PaginationParams {
  status?: AcademicYearStatus
}

export async function listAcademicYears(
  params: ListAcademicYearsParams = {},
): Promise<PaginatedResponse<AcademicYear>> {
  const { page, pageSize, search, status } = params
  return http.get<PaginatedResponse<AcademicYear>>('/academic-years', { page, pageSize, search, status })
}

export async function getAcademicYear(id: string): Promise<AcademicYear> {
  return http.get<AcademicYear>(`/academic-years/${id}`)
}

export async function createAcademicYear(input: AcademicYearInput): Promise<AcademicYear> {
  return http.post<AcademicYear>('/academic-years', input)
}

export async function updateAcademicYear(id: string, input: AcademicYearInput): Promise<AcademicYear> {
  return http.put<AcademicYear>(`/academic-years/${id}`, input)
}

export async function deleteAcademicYear(id: string): Promise<void> {
  await http.delete<void>(`/academic-years/${id}`)
}
