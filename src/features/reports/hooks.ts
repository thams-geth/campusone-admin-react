import { useQuery } from '@tanstack/react-query'
import {
  getAttendanceReport,
  getDepartmentPerformanceReport,
  getDropoutReport,
  getExamResultsReport,
  getFacultyWorkloadReport,
  getFinancialSummaryReport,
  getStudentStrengthReport,
  getSubjectPerformanceReport,
  type AttendanceReportParams,
  type StudentStrengthParams,
  type SubjectPerformanceParams,
} from '@/services/api/reportsApi'
import { listDepartments } from '@/services/api/departmentsApi'
import { listPrograms } from '@/services/api/programsApi'
import { listBatches } from '@/services/api/batchesApi'
import { listSections } from '@/services/api/sectionsApi'
import { listSubjects } from '@/services/api/subjectsApi'
import { listExams } from '@/services/api/examinationsApi'

/**
 * One hook per report endpoint (Reports module — 8 independent read-only
 * aggregates, no pagination, no mutations). Each tab in ReportsPage only
 * fetches once its pane is actually mounted: antd's `Tabs` doesn't render
 * an inactive pane's children until it's first activated (verified against
 * @rc-component/tabs — CSSMotion only renders once `visible` flips true),
 * so a plain always-on `useQuery` per tab component is enough to avoid
 * firing all 8 requests on page load; no explicit `enabled` gating needed
 * beyond exam-results' own examId precondition below.
 */

export function useStudentStrengthReport(params: StudentStrengthParams) {
  return useQuery({
    queryKey: ['reports', 'student-strength', params],
    queryFn: () => getStudentStrengthReport(params),
  })
}

export function useAttendanceReport(params: AttendanceReportParams) {
  return useQuery({
    queryKey: ['reports', 'attendance', params],
    queryFn: () => getAttendanceReport(params),
  })
}

export function useDepartmentPerformanceReport() {
  return useQuery({
    queryKey: ['reports', 'department-performance'],
    queryFn: () => getDepartmentPerformanceReport(),
  })
}

export function useSubjectPerformanceReport(params: SubjectPerformanceParams) {
  return useQuery({
    queryKey: ['reports', 'subject-performance', params],
    queryFn: () => getSubjectPerformanceReport(params),
  })
}

/** examId is required server-side — the query stays disabled until one is picked. */
export function useExamResultsReport(examId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'exam-results', examId],
    queryFn: () => getExamResultsReport({ examId: examId as string }),
    enabled: !!examId,
  })
}

export function useFacultyWorkloadReport() {
  return useQuery({
    queryKey: ['reports', 'faculty-workload'],
    queryFn: () => getFacultyWorkloadReport(),
  })
}

export function useFinancialSummaryReport() {
  return useQuery({
    queryKey: ['reports', 'financial-summary'],
    queryFn: () => getFinancialSummaryReport(),
  })
}

export function useDropoutReport() {
  return useQuery({
    queryKey: ['reports', 'dropout'],
    queryFn: () => getDropoutReport(),
  })
}

// ---- Small unpaginated-in-practice lookups, for filter selects and id->name resolution ----

export function useAllDepartmentsForReports() {
  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => listDepartments({ page: 1, pageSize: 100 }),
  })
}

export function useAllProgramsForReports() {
  return useQuery({ queryKey: ['programs', 'all'], queryFn: () => listPrograms({ page: 1, pageSize: 100 }) })
}

export function useAllBatchesForReports() {
  return useQuery({ queryKey: ['batches', 'all'], queryFn: () => listBatches({ page: 1, pageSize: 100 }) })
}

export function useAllSectionsForReports() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useAllSubjectsForReports() {
  return useQuery({ queryKey: ['subjects', 'all'], queryFn: () => listSubjects({ page: 1, pageSize: 100 }) })
}

export function useAllExamsForReports() {
  return useQuery({ queryKey: ['examinations', 'exams', 'all'], queryFn: () => listExams({ page: 1, pageSize: 100 }) })
}
