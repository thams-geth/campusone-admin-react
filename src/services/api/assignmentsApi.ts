import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Assignments (Milestone 2). Assignment workflow: DRAFT -> PUBLISHED ->
 * CLOSED; a student can only submit while PUBLISHED. attachmentUrl is a
 * client-supplied reference, not an uploaded file (no object storage
 * wired up). Wire format mirrors the backend exactly (uppercase enums).
 */

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type AssignmentSubmissionStatus = 'SUBMITTED' | 'LATE' | 'EVALUATED'

export interface Assignment {
  id: string
  tenantId: string
  subjectId: string
  facultyId: string
  sectionId: string
  title: string
  description: string | null
  startDate: string
  dueDate: string
  maxMarks: number
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
}

export interface AssignmentInput {
  subjectId: string
  sectionId: string
  /** Omit to resolve the caller's own Faculty profile; pass to let an admin create on someone's behalf. */
  facultyId?: string
  title: string
  description?: string
  startDate: string
  dueDate: string
  maxMarks: number
}

export interface ListAssignmentsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  sectionId?: string
  subjectId?: string
  status?: AssignmentStatus
}

export interface AssignmentSubmission {
  id: string
  tenantId: string
  assignmentId: string
  studentId: string
  submittedAt: string
  attachmentUrl: string | null
  status: AssignmentSubmissionStatus
  marksObtained: number | null
  feedback: string | null
  evaluatedByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface SubmitAssignmentInput {
  /** Omit to resolve the caller's own Student profile; pass to let staff submit on a student's behalf. */
  studentId?: string
  attachmentUrl?: string
}

export interface ListAssignmentSubmissionsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  status?: AssignmentSubmissionStatus
}

export interface EvaluateAssignmentSubmissionInput {
  marksObtained: number
  feedback?: string
}

// ---- Assignments ----

export async function listAssignments(
  params: ListAssignmentsParams = {},
): Promise<PaginatedResponse<Assignment>> {
  return http.get<PaginatedResponse<Assignment>>('/assignments', { ...params })
}

export async function getAssignment(id: string): Promise<Assignment> {
  return http.get<Assignment>(`/assignments/${id}`)
}

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  return http.post<Assignment>('/assignments', input)
}

export async function updateAssignment(id: string, input: AssignmentInput): Promise<Assignment> {
  return http.put<Assignment>(`/assignments/${id}`, input)
}

export async function deleteAssignment(id: string): Promise<void> {
  await http.delete<void>(`/assignments/${id}`)
}

export async function publishAssignment(id: string): Promise<Assignment> {
  return http.post<Assignment>(`/assignments/${id}/publish`)
}

export async function closeAssignment(id: string): Promise<Assignment> {
  return http.post<Assignment>(`/assignments/${id}/close`)
}

// ---- Submissions ----

export async function submitAssignment(
  assignmentId: string,
  input: SubmitAssignmentInput = {},
): Promise<AssignmentSubmission> {
  return http.post<AssignmentSubmission>(`/assignments/${assignmentId}/submissions`, input)
}

export async function listAssignmentSubmissions(
  assignmentId: string,
  params: ListAssignmentSubmissionsParams = {},
): Promise<PaginatedResponse<AssignmentSubmission>> {
  return http.get<PaginatedResponse<AssignmentSubmission>>(`/assignments/${assignmentId}/submissions`, { ...params })
}

export async function evaluateAssignmentSubmission(
  submissionId: string,
  input: EvaluateAssignmentSubmissionInput,
): Promise<AssignmentSubmission> {
  return http.put<AssignmentSubmission>(`/assignments/submissions/${submissionId}/evaluate`, input)
}
