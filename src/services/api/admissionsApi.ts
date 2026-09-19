import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Admissions module (`src/modules/admissions`) wire
 * format exactly — enum casing included. There's no established frontend
 * convention for this module yet, so no lowercase translation happens here
 * (unlike departmentsApi/studentsApi). Dates stay ISO strings.
 */

export type AdmissionStatus =
  | 'APPLIED'
  | 'DOCUMENT_VERIFICATION'
  | 'SHORTLISTED'
  | 'APPROVED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ENROLLED'
  | 'REJECTED'
  | 'WITHDRAWN'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface AdmissionApplication {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  programId: string
  status: AdmissionStatus
  reviewedByUserId?: string | null
  reviewNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdmissionApplicationInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  programId: string
}

export interface ListAdmissionApplicationsParams {
  page?: number
  pageSize?: number
  programId?: string
  status?: AdmissionStatus
}

/** Used for both advance and reject — the backend reuses one schema for both actions. */
export interface AdmissionReviewInput {
  reviewNotes?: string
}

export interface EnrollApplicationInput {
  rollNumber: string
  gender: Gender
  sectionId?: string
}

/** The Student row created by enrollment, plus the link back to the application it came from. */
export interface EnrolledStudent {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  rollNumber: string
  departmentId: string
  sectionId?: string | null
  gender: Gender
  dateOfBirth: string
  admissionDate: string
  status: string
  admissionApplicationId: string
  createdAt: string
  updatedAt: string
}

export async function listAdmissionApplications(
  params: ListAdmissionApplicationsParams = {},
): Promise<PaginatedResponse<AdmissionApplication>> {
  return http.get<PaginatedResponse<AdmissionApplication>>('/admissions', { ...params })
}

export async function getAdmissionApplication(id: string): Promise<AdmissionApplication> {
  return http.get<AdmissionApplication>(`/admissions/${id}`)
}

export async function createAdmissionApplication(input: AdmissionApplicationInput): Promise<AdmissionApplication> {
  return http.post<AdmissionApplication>('/admissions', input)
}

export async function updateAdmissionApplication(
  id: string,
  input: AdmissionApplicationInput,
): Promise<AdmissionApplication> {
  return http.put<AdmissionApplication>(`/admissions/${id}`, input)
}

/** Moves the application forward one step in the lifecycle (APPLIED -> ... -> ACCEPTED). */
export async function advanceApplication(
  id: string,
  input: AdmissionReviewInput = {},
): Promise<AdmissionApplication> {
  return http.post<AdmissionApplication>(`/admissions/${id}/advance`, input)
}

export async function rejectApplication(
  id: string,
  input: AdmissionReviewInput = {},
): Promise<AdmissionApplication> {
  return http.post<AdmissionApplication>(`/admissions/${id}/reject`, input)
}

export async function withdrawApplication(id: string): Promise<AdmissionApplication> {
  return http.post<AdmissionApplication>(`/admissions/${id}/withdraw`)
}

/** Only reachable from an ACCEPTED application — creates the real Student row and links it back. */
export async function enrollApplicant(id: string, input: EnrollApplicationInput): Promise<EnrolledStudent> {
  return http.post<EnrolledStudent>(`/admissions/${id}/enroll`, input)
}
