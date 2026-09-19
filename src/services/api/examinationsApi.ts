import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Examinations (Milestone 2, the biggest module — Exam/ExamSchedule/Marks).
 * Marks workflow: DRAFT -> SUBMITTED -> VERIFIED -> PUBLISHED, transitioned
 * a whole schedule at a time (submit/verify/publish act on every DRAFT/
 * SUBMITTED/VERIFIED mark for that schedule). Once VERIFIED/PUBLISHED, a
 * mark can't be edited directly — editMarks only works on DRAFT/SUBMITTED,
 * reviseMarks is the separate, audited path for already-PUBLISHED marks.
 * Grade/SGPA/CGPA are computed on read from PUBLISHED marks only, never
 * stored. Wire format mirrors the backend exactly (uppercase enums, ISO
 * dates, "HH:mm" time strings).
 *
 * Functions are grouped below: Exams, Exam Schedules, Marks workflow,
 * Marks direct edit/revise, Results (SGPA/CGPA).
 */

export type ExamType = 'INTERNAL' | 'MIDTERM' | 'FINAL' | 'SUPPLEMENTARY'
export type ExamStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED'
export type MarksStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'PUBLISHED'
export type MarksSpecialStatus = 'ABSENT' | 'MALPRACTICE' | 'WITHHELD'

export interface Exam {
  id: string
  tenantId: string
  name: string
  examType: ExamType
  academicYearId: string
  semesterNumber: number
  startDate: string
  endDate: string
  status: ExamStatus
  createdAt: string
  updatedAt: string
  /** Only present on getExam (findUnique includes { schedules: true }). */
  schedules?: ExamSchedule[]
}

export interface ExamInput {
  name: string
  examType: ExamType
  academicYearId: string
  semesterNumber: number
  startDate: string
  endDate: string
}

export interface ListExamsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  academicYearId?: string
  semesterNumber?: number
  status?: ExamStatus
}

export interface ExamSchedule {
  id: string
  tenantId: string
  examId: string
  subjectId: string
  examDate: string
  /** 24h "HH:mm", e.g. "09:00". */
  startTime: string
  endTime: string
  roomId: string
  createdAt: string
  updatedAt: string
}

export interface ExamScheduleInput {
  subjectId: string
  examDate: string
  startTime: string
  endTime: string
  roomId: string
}

export interface Marks {
  id: string
  tenantId: string
  examScheduleId: string
  studentId: string
  marksObtained: number | null
  maxMarks: number
  status: MarksStatus
  specialStatus: MarksSpecialStatus | null
  enteredByUserId: string | null
  verifiedByUserId: string | null
  publishedByUserId: string | null
  createdAt: string
  updatedAt: string
  /** Included on listMarksForSchedule — shape owned by studentsApi. */
  student?: Record<string, unknown>
}

export interface EnterMarksInput {
  marks: {
    studentId: string
    marksObtained?: number
    maxMarks: number
    specialStatus?: MarksSpecialStatus
  }[]
}

export interface EditMarksInput {
  marksObtained?: number
  specialStatus?: MarksSpecialStatus
}

export interface ReviseMarksInput {
  marksObtained: number
  /** Required — a mandatory audit reason for revising already-published marks. */
  reason: string
}

export interface SemesterResultSubject {
  subjectId: string
  subjectName: string
  subjectCode: string
  credits: number
  marksObtained: number
  maxMarks: number
  percentage: number
  grade: string
  gradePoints: number
}

export interface SemesterResult {
  studentId: string
  semesterNumber: number
  subjects: SemesterResultSubject[]
  sgpa: number
}

export interface CgpaResult {
  studentId: string
  subjectsCounted: number
  totalCredits: number
  cgpa: number
}

// ---- Exams ----

export async function listExams(params: ListExamsParams = {}): Promise<PaginatedResponse<Exam>> {
  return http.get<PaginatedResponse<Exam>>('/examinations/exams', { ...params })
}

export async function getExam(id: string): Promise<Exam> {
  return http.get<Exam>(`/examinations/exams/${id}`)
}

export async function createExam(input: ExamInput): Promise<Exam> {
  return http.post<Exam>('/examinations/exams', input)
}

export async function updateExam(id: string, input: ExamInput): Promise<Exam> {
  return http.put<Exam>(`/examinations/exams/${id}`, input)
}

export async function deleteExam(id: string): Promise<void> {
  await http.delete<void>(`/examinations/exams/${id}`)
}

// ---- Exam schedules ----

/** Not paginated — the service returns a plain array (one exam has few subjects). */
export async function listExamSchedules(examId: string): Promise<ExamSchedule[]> {
  return http.get<ExamSchedule[]>(`/examinations/exams/${examId}/schedules`)
}

export async function createExamSchedule(examId: string, input: ExamScheduleInput): Promise<ExamSchedule> {
  return http.post<ExamSchedule>(`/examinations/exams/${examId}/schedules`, input)
}

export async function updateExamSchedule(id: string, input: ExamScheduleInput): Promise<ExamSchedule> {
  return http.put<ExamSchedule>(`/examinations/schedules/${id}`, input)
}

export async function deleteExamSchedule(id: string): Promise<void> {
  await http.delete<void>(`/examinations/schedules/${id}`)
}

// ---- Marks workflow: DRAFT -> SUBMITTED -> VERIFIED -> PUBLISHED ----
// Each of these acts on the whole schedule's roster, not one student.

export async function enterMarks(examScheduleId: string, input: EnterMarksInput): Promise<Marks[]> {
  return http.post<Marks[]>(`/examinations/schedules/${examScheduleId}/marks`, input)
}

/** Full-roster marks view — staff only (MARKS_ENTER/VERIFY/PUBLISH). Students use getSemesterResult/getCgpa instead. */
export async function listMarksForSchedule(examScheduleId: string): Promise<Marks[]> {
  return http.get<Marks[]>(`/examinations/schedules/${examScheduleId}/marks`)
}

export async function submitMarks(examScheduleId: string): Promise<Marks[]> {
  return http.post<Marks[]>(`/examinations/schedules/${examScheduleId}/marks/submit`)
}

export async function verifyMarks(examScheduleId: string): Promise<Marks[]> {
  return http.post<Marks[]>(`/examinations/schedules/${examScheduleId}/marks/verify`)
}

export async function publishMarks(examScheduleId: string): Promise<Marks[]> {
  return http.post<Marks[]>(`/examinations/schedules/${examScheduleId}/marks/publish`)
}

// ---- Marks direct edit / revise ----

/** DRAFT/SUBMITTED marks only — VERIFIED/PUBLISHED marks reject this, use reviseMarks instead. */
export async function editMarks(id: string, input: EditMarksInput): Promise<Marks> {
  return http.put<Marks>(`/examinations/marks/${id}`, input)
}

/** PUBLISHED marks only — the separate, audited (MARKS_REVISE) correction path. */
export async function reviseMarks(id: string, input: ReviseMarksInput): Promise<Marks> {
  return http.put<Marks>(`/examinations/marks/${id}/revise`, input)
}

// ---- Results: grade / SGPA / CGPA, computed on read from PUBLISHED marks only ----

export async function getSemesterResult(semesterNumber: number, studentId?: string): Promise<SemesterResult> {
  return http.get<SemesterResult>(`/examinations/results/semester/${semesterNumber}`, { studentId })
}

export async function getCgpa(studentId?: string): Promise<CgpaResult> {
  return http.get<CgpaResult>('/examinations/results/cgpa', { studentId })
}
