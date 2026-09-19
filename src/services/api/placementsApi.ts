import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Placements module (`src/modules/placements`) wire
 * format exactly — enum casing included, no lowercase translation. No
 * separate Interview/PlacementResult entities — both fold into the
 * application's status progression. Eligibility is a simple minCgpa filter
 * enforced server-side on apply. Dates stay ISO strings.
 */

export type PlacementApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'REJECTED'

export interface Company {
  id: string
  tenantId: string
  name: string
  website?: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanyInput {
  name: string
  website?: string
}

export interface JobOpening {
  id: string
  tenantId: string
  companyId: string
  title: string
  description?: string | null
  minCgpa?: number | null
  ctcOffered?: number | null
  applicationDeadline?: string | null
  createdAt: string
  updatedAt: string
}

export interface JobOpeningInput {
  companyId: string
  title: string
  description?: string
  minCgpa?: number
  ctcOffered?: number
  applicationDeadline?: string
}

export interface ListJobOpeningsParams {
  page?: number
  pageSize?: number
  companyId?: string
}

export interface PlacementApplication {
  id: string
  tenantId: string
  studentId: string
  jobOpeningId: string
  status: PlacementApplicationStatus
  notes?: string | null
  offeredCtc?: number | null
  createdAt: string
  updatedAt: string
}

/** studentId is optional — omit it to apply as the caller's own linked Student record. */
export interface ApplyToJobInput {
  studentId?: string
}

export interface UpdateApplicationStatusInput {
  status: PlacementApplicationStatus
  notes?: string
  offeredCtc?: number
}

export interface ListApplicationsParams {
  page?: number
  pageSize?: number
  jobOpeningId?: string
  studentId?: string
  status?: PlacementApplicationStatus
}

export async function listCompanies(): Promise<Company[]> {
  return http.get<Company[]>('/placements/companies')
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  return http.post<Company>('/placements/companies', input)
}

export async function deleteCompany(id: string): Promise<void> {
  await http.delete<void>(`/placements/companies/${id}`)
}

export async function listJobOpenings(params: ListJobOpeningsParams = {}): Promise<PaginatedResponse<JobOpening>> {
  return http.get<PaginatedResponse<JobOpening>>('/placements/openings', { ...params })
}

export async function getJobOpening(id: string): Promise<JobOpening> {
  return http.get<JobOpening>(`/placements/openings/${id}`)
}

export async function createJobOpening(input: JobOpeningInput): Promise<JobOpening> {
  return http.post<JobOpening>('/placements/openings', input)
}

export async function deleteJobOpening(id: string): Promise<void> {
  await http.delete<void>(`/placements/openings/${id}`)
}

/** Enforces the deadline and minCgpa (via computed CGPA) server-side. */
export async function applyToJobOpening(id: string, input: ApplyToJobInput = {}): Promise<PlacementApplication> {
  return http.post<PlacementApplication>(`/placements/openings/${id}/apply`, input)
}

/** Requires PLACEMENT_MANAGE — see listMyPlacementApplications for the self-service equivalent. */
export async function listApplications(
  params: ListApplicationsParams = {},
): Promise<PaginatedResponse<PlacementApplication>> {
  return http.get<PaginatedResponse<PlacementApplication>>('/placements/applications', { ...params })
}

/** The caller's own applications — resolved server-side from Student.userId, not paginated. */
export async function listMyApplications(): Promise<PlacementApplication[]> {
  return http.get<PlacementApplication[]>('/placements/applications/mine')
}

export async function updateApplicationStatus(
  id: string,
  input: UpdateApplicationStatusInput,
): Promise<PlacementApplication> {
  return http.put<PlacementApplication>(`/placements/applications/${id}/status`, input)
}
