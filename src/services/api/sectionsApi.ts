import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's SectionStatus enum exactly — no lowercase translation. */
export type SectionStatus = 'ACTIVE' | 'INACTIVE'

export interface Section {
  id: string
  tenantId: string
  batchId: string
  name: string
  currentSemester: number
  capacity: number | null
  status: SectionStatus
  createdAt: string
  updatedAt: string
}

export interface SectionInput {
  batchId: string
  name: string
  currentSemester: number
  capacity?: number
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: SectionStatus
}

export interface ListSectionsParams extends PaginationParams {
  batchId?: string
  status?: SectionStatus
}

export async function listSections(params: ListSectionsParams = {}): Promise<PaginatedResponse<Section>> {
  const { page, pageSize, search, batchId, status } = params
  return http.get<PaginatedResponse<Section>>('/sections', { page, pageSize, search, batchId, status })
}

export async function getSection(id: string): Promise<Section> {
  return http.get<Section>(`/sections/${id}`)
}

export async function createSection(input: SectionInput): Promise<Section> {
  return http.post<Section>('/sections', input)
}

export async function updateSection(id: string, input: SectionInput): Promise<Section> {
  return http.put<Section>(`/sections/${id}`, input)
}

export async function deleteSection(id: string): Promise<void> {
  await http.delete<void>(`/sections/${id}`)
}
