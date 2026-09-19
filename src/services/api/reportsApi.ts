import { http } from '@/services/api/httpClient'

/**
 * Reports (Milestone 2, plus Milestone 4's financial-summary/dropout
 * additions) — read-only aggregations, no create/update/delete. Every
 * route requires REPORTS_READ; none of them paginate, each returns a
 * purpose-built aggregate shape. Wire format mirrors the backend exactly.
 */

export interface StudentStrengthParams {
  departmentId?: string
  programId?: string
  batchId?: string
  sectionId?: string
}

export interface StudentStrengthReport {
  total: number
  byDepartment: { departmentId: string; count: number }[]
}

export interface AttendanceReportParams {
  sectionId?: string
  subjectId?: string
  dateFrom?: string
  dateTo?: string
}

export interface AttendanceReport {
  totalSessions: number
  totalRecords: number
  presentCount: number
  attendancePercentage: number
}

export interface DepartmentPerformanceRow {
  departmentId: string
  name: string
  studentCount: number
  studentsAssessed: number
  averageMarksPercentage: number
}

export interface SubjectPerformanceParams {
  programId?: string
}

export interface SubjectPerformanceRow {
  subjectId: string
  name: string
  code: string
  studentsAssessed: number
  averageMarksPercentage: number
}

export interface ExamResultsParams {
  examId: string
}

export interface ExamResultsReport {
  examId: string
  examName: string
  totalAssessed: number
  passCount: number
  failCount: number
  averagePercentage: number
}

export interface FacultyWorkloadRow {
  facultyId: string
  name: string
  subjectsAssigned: number
  weeklyPeriods: number
}

export interface FinancialSummaryReport {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  byCategory: { category: string; invoiced: number; collected: number; outstanding: number }[]
}

export interface DropoutReport {
  total: number
  byDepartment: { departmentId: string; count: number }[]
  students: { id: string; firstName: string; lastName: string; rollNumber: string; departmentId: string }[]
}

export async function getStudentStrengthReport(params: StudentStrengthParams = {}): Promise<StudentStrengthReport> {
  return http.get<StudentStrengthReport>('/reports/student-strength', { ...params })
}

export async function getAttendanceReport(params: AttendanceReportParams = {}): Promise<AttendanceReport> {
  return http.get<AttendanceReport>('/reports/attendance', { ...params })
}

export async function getDepartmentPerformanceReport(): Promise<DepartmentPerformanceRow[]> {
  return http.get<DepartmentPerformanceRow[]>('/reports/department-performance')
}

export async function getSubjectPerformanceReport(
  params: SubjectPerformanceParams = {},
): Promise<SubjectPerformanceRow[]> {
  return http.get<SubjectPerformanceRow[]>('/reports/subject-performance', { ...params })
}

export async function getExamResultsReport(params: ExamResultsParams): Promise<ExamResultsReport> {
  return http.get<ExamResultsReport>('/reports/exam-results', { ...params })
}

export async function getFacultyWorkloadReport(): Promise<FacultyWorkloadRow[]> {
  return http.get<FacultyWorkloadRow[]>('/reports/faculty-workload')
}

export async function getFinancialSummaryReport(): Promise<FinancialSummaryReport> {
  return http.get<FinancialSummaryReport>('/reports/financial-summary')
}

export async function getDropoutReport(): Promise<DropoutReport> {
  return http.get<DropoutReport>('/reports/dropout')
}
