import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Certificates module (`src/modules/certificates`)
 * wire format exactly — enum casing included, no lowercase translation.
 * This is the issuance workflow (distinct from the Documents module's
 * arbitrary file uploads). `verificationCode` stands in for a digital
 * signature/QR — there's no PDF/QR generation, a QR is just that code
 * rendered client-side. Dates stay ISO strings.
 */

export type CertificateRequestStatus = 'REQUESTED' | 'ISSUED' | 'REJECTED'

export interface CertificateType {
  id: string
  tenantId: string
  name: string
  category?: string | null
  createdAt: string
  updatedAt: string
}

export interface CertificateTypeInput {
  name: string
  category?: string
}

export interface CertificateRequest {
  id: string
  tenantId: string
  studentId: string
  certificateTypeId: string
  status: CertificateRequestStatus
  issuedByUserId?: string | null
  issuedAt?: string | null
  verificationCode?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

/** studentId is optional — omit it to request for the caller's own linked Student record. */
export interface CreateCertificateRequestInput {
  certificateTypeId: string
  studentId?: string
}

export interface ListCertificateRequestsParams {
  page?: number
  pageSize?: number
  studentId?: string
  status?: CertificateRequestStatus
}

export interface RejectCertificateRequestInput {
  rejectionReason: string
}

export type VerifyCertificateResult =
  | { valid: false }
  | { valid: true; certificateType: string; studentName: string; rollNumber: string; issuedAt: string | null }

export async function listCertificateTypes(): Promise<CertificateType[]> {
  return http.get<CertificateType[]>('/certificates/types')
}

export async function createCertificateType(input: CertificateTypeInput): Promise<CertificateType> {
  return http.post<CertificateType>('/certificates/types', input)
}

export async function deleteCertificateType(id: string): Promise<void> {
  await http.delete<void>(`/certificates/types/${id}`)
}

export async function createCertificateRequest(input: CreateCertificateRequestInput): Promise<CertificateRequest> {
  return http.post<CertificateRequest>('/certificates/requests', input)
}

/** Requires CERTIFICATE_ISSUE — see listMyCertificateRequests for the self-service equivalent. */
export async function listCertificateRequests(
  params: ListCertificateRequestsParams = {},
): Promise<PaginatedResponse<CertificateRequest>> {
  return http.get<PaginatedResponse<CertificateRequest>>('/certificates/requests', { ...params })
}

/** The caller's own requests — resolved server-side from Student.userId, not paginated. */
export async function listMyCertificateRequests(): Promise<CertificateRequest[]> {
  return http.get<CertificateRequest[]>('/certificates/requests/mine')
}

export async function issueCertificate(id: string): Promise<CertificateRequest> {
  return http.post<CertificateRequest>(`/certificates/requests/${id}/issue`)
}

export async function rejectCertificateRequest(
  id: string,
  input: RejectCertificateRequestInput,
): Promise<CertificateRequest> {
  return http.post<CertificateRequest>(`/certificates/requests/${id}/reject`, input)
}

/** Public-style lookup by verificationCode — still requires CERTIFICATE_READ, it's not an unauthenticated endpoint. */
export async function verifyCertificate(code: string): Promise<VerifyCertificateResult> {
  return http.get<VerifyCertificateResult>(`/certificates/verify/${code}`)
}
