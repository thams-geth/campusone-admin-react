import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's ProgramStatus enum exactly — no lowercase translation. */
export type ProgramStatus = 'ACTIVE' | 'INACTIVE'

export interface Program {
  id: string
  tenantId: string
  departmentId: string
  name: string
  code: string
  durationYears: number
  status: ProgramStatus
  createdAt: string
  updatedAt: string
}

export interface ProgramInput {
  departmentId: string
  name: string
  code: string
  durationYears: number
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: ProgramStatus
}

export interface ListProgramsParams extends PaginationParams {
  departmentId?: string
  status?: ProgramStatus
}

export async function listPrograms(params: ListProgramsParams = {}): Promise<PaginatedResponse<Program>> {
  const { page, pageSize, search, departmentId, status } = params
  return http.get<PaginatedResponse<Program>>('/programs', { page, pageSize, search, departmentId, status })
}

export async function getProgram(id: string): Promise<Program> {
  return http.get<Program>(`/programs/${id}`)
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  return http.post<Program>('/programs', input)
}

export async function updateProgram(id: string, input: ProgramInput): Promise<Program> {
  return http.put<Program>(`/programs/${id}`, input)
}

export async function deleteProgram(id: string): Promise<void> {
  await http.delete<void>(`/programs/${id}`)
}
