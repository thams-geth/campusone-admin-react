import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Documents (Milestone 2) — generic document metadata, distinct from
 * Certificates' issuance workflow. fileUrl is a reference to wherever the
 * file actually lives, not an uploaded file (no object storage wired up).
 * Wire format mirrors the backend exactly (uppercase enums, ISO dates).
 */

export type DocumentOwnerType = 'STUDENT' | 'FACULTY' | 'APPLICANT'
export type DocumentType =
  | 'BONAFIDE'
  | 'TRANSFER_CERTIFICATE'
  | 'CONDUCT_CERTIFICATE'
  | 'MARK_SHEET'
  | 'ID_PROOF'
  | 'OTHER'
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface Document {
  id: string
  tenantId: string
  ownerType: DocumentOwnerType
  ownerId: string
  type: DocumentType
  fileUrl: string
  version: number
  uploadedByUserId: string
  verifiedByUserId: string | null
  status: DocumentStatus
  expiryDate: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentInput {
  ownerType: DocumentOwnerType
  ownerId: string
  type: DocumentType
  fileUrl: string
  expiryDate?: string
}

export interface ListDocumentsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  ownerType?: DocumentOwnerType
  ownerId?: string
  type?: DocumentType
  status?: DocumentStatus
}

export async function listDocuments(params: ListDocumentsParams = {}): Promise<PaginatedResponse<Document>> {
  return http.get<PaginatedResponse<Document>>('/documents', { ...params })
}

/** The caller's own documents (resolved from their Student/Faculty profile). Not paginated — returns [] if the caller has neither profile. */
export async function listMyDocuments(): Promise<Document[]> {
  return http.get<Document[]>('/documents/mine')
}

export async function getDocument(id: string): Promise<Document> {
  return http.get<Document>(`/documents/${id}`)
}

export async function createDocument(input: DocumentInput): Promise<Document> {
  return http.post<Document>('/documents', input)
}

export async function updateDocument(id: string, input: DocumentInput): Promise<Document> {
  return http.put<Document>(`/documents/${id}`, input)
}

export async function deleteDocument(id: string): Promise<void> {
  await http.delete<void>(`/documents/${id}`)
}

export async function verifyDocument(id: string): Promise<Document> {
  return http.post<Document>(`/documents/${id}/verify`)
}

export async function rejectDocument(id: string): Promise<Document> {
  return http.post<Document>(`/documents/${id}/reject`)
}
