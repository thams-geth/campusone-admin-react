import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's FacultyStatus enum exactly — no lowercase translation. */
export type FacultyStatus = 'ACTIVE' | 'INACTIVE'

/**
 * Faculty is both an employee profile and a login-capable account
 * server-side (a Faculty row joined to its User) — the API flattens
 * the joined User's name/email/isActive onto the Faculty response, so
 * this shape mirrors that flattened DTO rather than the raw Faculty
 * table columns.
 */
export interface Faculty {
  id: string
  tenantId: string
  userId: string
  employeeCode: string
  departmentId: string
  designation: string
  qualification: string | null
  experienceYears: number
  joiningDate: string
  status: FacultyStatus
  createdAt: string
  updatedAt: string
  name: string
  email: string
  isActive: boolean
}

/**
 * Creating a faculty member provisions the underlying User account too,
 * so the admin sets an initial password here — there's no invite/reset
 * flow yet (see campusone-api's faculty.schema.ts doc comment).
 */
export interface FacultyCreateInput {
  name: string
  email: string
  password: string
  employeeCode: string
  departmentId: string
  designation: string
  qualification?: string
  /** Defaults to `0` server-side when omitted. */
  experienceYears?: number
  joiningDate: string
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: FacultyStatus
}

/** Email/password changes aren't supported through this endpoint yet. */
export interface FacultyUpdateInput {
  name: string
  employeeCode: string
  departmentId: string
  designation: string
  qualification?: string
  experienceYears?: number
  joiningDate: string
  status?: FacultyStatus
}

export interface ListFacultyParams extends PaginationParams {
  departmentId?: string
  status?: FacultyStatus
}

export async function listFaculty(params: ListFacultyParams = {}): Promise<PaginatedResponse<Faculty>> {
  const { page, pageSize, search, departmentId, status } = params
  return http.get<PaginatedResponse<Faculty>>('/faculty', { page, pageSize, search, departmentId, status })
}

export async function getFaculty(id: string): Promise<Faculty> {
  return http.get<Faculty>(`/faculty/${id}`)
}

export async function createFaculty(input: FacultyCreateInput): Promise<Faculty> {
  return http.post<Faculty>('/faculty', input)
}

export async function updateFaculty(id: string, input: FacultyUpdateInput): Promise<Faculty> {
  return http.put<Faculty>(`/faculty/${id}`, input)
}

export async function deleteFaculty(id: string): Promise<void> {
  await http.delete<void>(`/faculty/${id}`)
}

/**
 * `GET /faculty/:id/360` — a read-only cross-module aggregation (teaching
 * load, timetable, attendance sessions taken, assignments, leave requests
 * reviewed). `faculty` reuses the flattened `Faculty` DTO plus the resolved
 * department name.
 */
export interface FacultySummary360 {
  faculty: Faculty & { departmentName: string }
  teaching: {
    subjectCount: number
    subjects: Array<{ id: string; code: string; name: string; semesterNumber: number; credits: number }>
  }
  timetable: {
    weeklyPeriods: number
    entries: Array<{
      id: string
      dayOfWeek: string
      startTime: string
      endTime: string
      sectionName: string
      subjectName: string
      roomName: string
    }>
  }
  attendance: {
    sessionsTaken: number
    recentSessions: Array<{ id: string; date: string; status: string; sectionName: string; subjectName: string }>
  }
  assignments: { count: number; recent: Array<{ id: string; title: string; status: string; dueDate: string }> }
  leaveReviewed: { count: number }
}

export async function getFaculty360(id: string): Promise<FacultySummary360> {
  return http.get<FacultySummary360>(`/faculty/${id}/360`)
}
