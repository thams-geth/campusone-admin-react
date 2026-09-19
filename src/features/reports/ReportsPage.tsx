import { Tabs, Typography } from 'antd'
import { StudentStrengthTab } from '@/features/reports/StudentStrengthTab'
import { AttendanceTab } from '@/features/reports/AttendanceTab'
import { DepartmentPerformanceTab } from '@/features/reports/DepartmentPerformanceTab'
import { SubjectPerformanceTab } from '@/features/reports/SubjectPerformanceTab'
import { ExamResultsTab } from '@/features/reports/ExamResultsTab'
import { FacultyWorkloadTab } from '@/features/reports/FacultyWorkloadTab'
import { FinancialSummaryTab } from '@/features/reports/FinancialSummaryTab'
import { DropoutTab } from '@/features/reports/DropoutTab'

/**
 * Eight independent read-only report aggregates (REPORTS_READ — see
 * reportsApi.ts), one per tab. No in-page role gating: the nav entry is
 * already restricted to EXAM_ROLES, so every visitor here can see
 * everything.
 *
 * Lazy per-tab fetching: antd's `Tabs` doesn't mount an inactive pane's
 * children until it's activated for the first time (@rc-component/tabs
 * wraps each pane in CSSMotion with `visible={active}`, and doesn't
 * render until visible flips true) — already-visited panes then stay
 * mounted rather than being torn down, which is the desired "don't
 * refetch every switch" behavior too. So a plain `Tabs items={...}` with
 * each tab's content as its own component (each owning a normal,
 * always-on `useQuery`) is enough to avoid firing all 8 report requests
 * on page load, with no extra `enabled`/`destroyOnHidden` wiring needed.
 */
export function ReportsPage() {
  const items = [
    { key: 'student-strength', label: 'Student Strength', children: <StudentStrengthTab /> },
    { key: 'attendance', label: 'Attendance', children: <AttendanceTab /> },
    { key: 'department-performance', label: 'Department Performance', children: <DepartmentPerformanceTab /> },
    { key: 'subject-performance', label: 'Subject Performance', children: <SubjectPerformanceTab /> },
    { key: 'exam-results', label: 'Exam Results', children: <ExamResultsTab /> },
    { key: 'faculty-workload', label: 'Faculty Workload', children: <FacultyWorkloadTab /> },
    { key: 'financial-summary', label: 'Financial Summary', children: <FinancialSummaryTab /> },
    { key: 'dropout', label: 'Dropout', children: <DropoutTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Reports
      </Typography.Title>
      <Tabs defaultActiveKey="student-strength" items={items} />
    </div>
  )
}
