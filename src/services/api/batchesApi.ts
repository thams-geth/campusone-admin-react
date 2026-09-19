import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's BatchStatus enum exactly — no lowercase translation. */
export type BatchStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED'

export interface Batch {
  id: string
  tenantId: string
  programId: string
  academicYearId: string
  name: string
  startYear: number
  endYear: number
  status: BatchStatus
  createdAt: string
  updatedAt: string
}

export interface BatchInput {
  programId: string
  academicYearId: string
  name: string
  startYear: number
  endYear: number
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: BatchStatus
}

export interface ListBatchesParams extends PaginationParams {
  programId?: string
  academicYearId?: string
  status?: BatchStatus
}

export async function listBatches(params: ListBatchesParams = {}): Promise<PaginatedResponse<Batch>> {
  const { page, pageSize, search, programId, academicYearId, status } = params
  return http.get<PaginatedResponse<Batch>>('/batches', { page, pageSize, search, programId, academicYearId, status })
}

export async function getBatch(id: string): Promise<Batch> {
  return http.get<Batch>(`/batches/${id}`)
}

export async function createBatch(input: BatchInput): Promise<Batch> {
  return http.post<Batch>('/batches', input)
}

export async function updateBatch(id: string, input: BatchInput): Promise<Batch> {
  return http.put<Batch>(`/batches/${id}`, input)
}

export async function deleteBatch(id: string): Promise<void> {
  await http.delete<void>(`/batches/${id}`)
}
