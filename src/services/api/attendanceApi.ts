import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Attendance (Milestone 2). Session workflow: DRAFT -> SUBMITTED -> LOCKED;
 * once LOCKED, records can only change via the correction approve/reject
 * flow. Wire format mirrors the backend exactly (uppercase enums, ISO date
 * strings) — no lowercase translation, unlike departmentsApi/studentsApi.
 */

export type AttendanceSessionStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_LEAVE'
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AttendanceSession {
  id: string
  tenantId: string
  sectionId: string
  subjectId: string
  facultyId: string
  date: string
  status: AttendanceSessionStatus
  createdAt: string
  updatedAt: string
  /** Only present on getSession (findUnique includes { records: { include: { student: true } } }). */
  records?: AttendanceRecord[]
}

export interface AttendanceRecord {
  id: string
  tenantId: string
  sessionId: string
  studentId: string
  status: AttendanceStatus
  createdAt: string
  updatedAt: string
  /** Included on getSession, listAttendanceByStudent/Section/Subject — shape owned by studentsApi. */
  student?: Record<string, unknown>
  /** Included on listAttendanceByStudent/Section/Subject. */
  session?: AttendanceSession
}

export interface AttendanceCorrection {
  id: string
  tenantId: string
  recordId: string
  requestedStatus: AttendanceStatus
  reason: string
  status: CorrectionStatus
  requestedByUserId: string
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  /** Included on listAttendanceCorrections. */
  record?: AttendanceRecord
}

export interface ListAttendanceSessionsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  sectionId?: string
  subjectId?: string
  facultyId?: string
}

export interface CreateAttendanceSessionInput {
  sectionId: string
  subjectId: string
  date: string
  /** Omit to resolve the caller's own Faculty profile; pass to let an admin create on someone's behalf. */
  facultyId?: string
}

export interface MarkAttendanceRecordsInput {
  records: { studentId: string; status: AttendanceStatus }[]
}

export interface ListAttendanceRecordsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  dateFrom?: string
  dateTo?: string
}

export interface RequestAttendanceCorrectionInput {
  requestedStatus: AttendanceStatus
  reason: string
}

export interface ListAttendanceCorrectionsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  status?: CorrectionStatus
}

// ---- Sessions ----

export async function listAttendanceSessions(
  params: ListAttendanceSessionsParams = {},
): Promise<PaginatedResponse<AttendanceSession>> {
  return http.get<PaginatedResponse<AttendanceSession>>('/attendance/sessions', { ...params })
}

export async function getAttendanceSession(id: string): Promise<AttendanceSession> {
  return http.get<AttendanceSession>(`/attendance/sessions/${id}`)
}

export async function createAttendanceSession(input: CreateAttendanceSessionInput): Promise<AttendanceSession> {
  return http.post<AttendanceSession>('/attendance/sessions', input)
}

export async function markAttendanceRecords(
  sessionId: string,
  input: MarkAttendanceRecordsInput,
): Promise<AttendanceSession> {
  return http.put<AttendanceSession>(`/attendance/sessions/${sessionId}/records`, input)
}

export async function submitAttendanceSession(id: string): Promise<AttendanceSession> {
  return http.post<AttendanceSession>(`/attendance/sessions/${id}/submit`)
}

export async function lockAttendanceSession(id: string): Promise<AttendanceSession> {
  return http.post<AttendanceSession>(`/attendance/sessions/${id}/lock`)
}

// ---- Records (read by student / section / subject) ----

export async function listAttendanceByStudent(
  studentId: string,
  params: ListAttendanceRecordsParams = {},
): Promise<PaginatedResponse<AttendanceRecord>> {
  return http.get<PaginatedResponse<AttendanceRecord>>(`/attendance/student/${studentId}`, { ...params })
}

export async function listAttendanceBySection(
  sectionId: string,
  params: ListAttendanceRecordsParams = {},
): Promise<PaginatedResponse<AttendanceRecord>> {
  return http.get<PaginatedResponse<AttendanceRecord>>(`/attendance/section/${sectionId}`, { ...params })
}

export async function listAttendanceBySubject(
  subjectId: string,
  params: ListAttendanceRecordsParams = {},
): Promise<PaginatedResponse<AttendanceRecord>> {
  return http.get<PaginatedResponse<AttendanceRecord>>(`/attendance/subject/${subjectId}`, { ...params })
}

// ---- Corrections ----

export async function requestAttendanceCorrection(
  recordId: string,
  input: RequestAttendanceCorrectionInput,
): Promise<AttendanceCorrection> {
  return http.post<AttendanceCorrection>(`/attendance/records/${recordId}/correction`, input)
}

export async function listAttendanceCorrections(
  params: ListAttendanceCorrectionsParams = {},
): Promise<PaginatedResponse<AttendanceCorrection>> {
  return http.get<PaginatedResponse<AttendanceCorrection>>('/attendance/corrections', { ...params })
}

export async function approveAttendanceCorrection(id: string): Promise<AttendanceCorrection> {
  return http.post<AttendanceCorrection>(`/attendance/corrections/${id}/approve`)
}

export async function rejectAttendanceCorrection(id: string): Promise<AttendanceCorrection> {
  return http.post<AttendanceCorrection>(`/attendance/corrections/${id}/reject`)
}
