import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { RequireAuth, RequireRole } from '@/features/auth/RouteGuards'
import { ADMIN_ROLES, EXAM_ROLES, PLATFORM_ADMIN_ROLES, STAFF_ROLES } from '@/app/router/navConfig'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

// Route-level code splitting: a tenant only downloads the module bundles
// for pages they actually visit, matching the "install modules, don't
// ship them all upfront" model in CLAUDE.md.
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const StudentsPage = lazy(() => import('@/features/students/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const StudentFormPage = lazy(() =>
  import('@/features/students/StudentFormPage').then((m) => ({ default: m.StudentFormPage })),
)
const StudentDetailsPage = lazy(() =>
  import('@/features/students/StudentDetailsPage').then((m) => ({ default: m.StudentDetailsPage })),
)
const DepartmentsPage = lazy(() =>
  import('@/features/departments/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })),
)
const AnnouncementsPage = lazy(() =>
  import('@/features/announcements/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })),
)
const AssignmentsPage = lazy(() =>
  import('@/features/assignments/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage })),
)
const AssignmentDetailsPage = lazy(() =>
  import('@/features/assignments/AssignmentDetailsPage').then((m) => ({ default: m.AssignmentDetailsPage })),
)
const LeavePage = lazy(() => import('@/features/leave/LeavePage').then((m) => ({ default: m.LeavePage })))
const AttendancePage = lazy(() =>
  import('@/features/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage })),
)
const AttendanceSessionPage = lazy(() =>
  import('@/features/attendance/AttendanceSessionPage').then((m) => ({ default: m.AttendanceSessionPage })),
)
const AttendanceCorrectionsPage = lazy(() =>
  import('@/features/attendance/AttendanceCorrectionsPage').then((m) => ({ default: m.AttendanceCorrectionsPage })),
)
const ExaminationsPage = lazy(() =>
  import('@/features/examinations/ExaminationsPage').then((m) => ({ default: m.ExaminationsPage })),
)
const ExamDetailsPage = lazy(() =>
  import('@/features/examinations/ExamDetailsPage').then((m) => ({ default: m.ExamDetailsPage })),
)
const ExamScheduleMarksPage = lazy(() =>
  import('@/features/examinations/ExamScheduleMarksPage').then((m) => ({ default: m.ExamScheduleMarksPage })),
)
const AdmissionsPage = lazy(() =>
  import('@/features/admissions/AdmissionsPage').then((m) => ({ default: m.AdmissionsPage })),
)
const AdmissionApplicationDetailsPage = lazy(() =>
  import('@/features/admissions/AdmissionApplicationDetailsPage').then((m) => ({
    default: m.AdmissionApplicationDetailsPage,
  })),
)
const PlacementsPage = lazy(() =>
  import('@/features/placements/PlacementsPage').then((m) => ({ default: m.PlacementsPage })),
)
const JobOpeningDetailsPage = lazy(() =>
  import('@/features/placements/JobOpeningDetailsPage').then((m) => ({ default: m.JobOpeningDetailsPage })),
)
const FeesPage = lazy(() => import('@/features/fees/FeesPage').then((m) => ({ default: m.FeesPage })))
const FeeInvoiceDetailsPage = lazy(() =>
  import('@/features/fees/FeeInvoiceDetailsPage').then((m) => ({ default: m.FeeInvoiceDetailsPage })),
)
const HostelPage = lazy(() => import('@/features/hostel/HostelPage').then((m) => ({ default: m.HostelPage })))
const TransportPage = lazy(() =>
  import('@/features/transport/TransportPage').then((m) => ({ default: m.TransportPage })),
)
const LibraryPage = lazy(() => import('@/features/library/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const CertificatesPage = lazy(() =>
  import('@/features/certificates/CertificatesPage').then((m) => ({ default: m.CertificatesPage })),
)
const ActivitiesPage = lazy(() =>
  import('@/features/activities/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })),
)
const BillingPage = lazy(() => import('@/features/billing/BillingPage').then((m) => ({ default: m.BillingPage })))
const DeveloperSettingsPage = lazy(() =>
  import('@/features/developer/DeveloperSettingsPage').then((m) => ({ default: m.DeveloperSettingsPage })),
)
const ApprovalsPage = lazy(() =>
  import('@/features/approvals/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)
const ClassGroupsPage = lazy(() =>
  import('@/features/class-groups/ClassGroupsPage').then((m) => ({ default: m.ClassGroupsPage })),
)
const AcademicYearsPage = lazy(() =>
  import('@/features/academic-years/AcademicYearsPage').then((m) => ({ default: m.AcademicYearsPage })),
)
const ProgramsPage = lazy(() =>
  import('@/features/programs/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
)
const BatchesPage = lazy(() => import('@/features/batches/BatchesPage').then((m) => ({ default: m.BatchesPage })))
const SectionsPage = lazy(() =>
  import('@/features/sections/SectionsPage').then((m) => ({ default: m.SectionsPage })),
)
const SubjectsPage = lazy(() =>
  import('@/features/subjects/SubjectsPage').then((m) => ({ default: m.SubjectsPage })),
)
const FacultyPage = lazy(() => import('@/features/faculty/FacultyPage').then((m) => ({ default: m.FacultyPage })))
const FacultyFormPage = lazy(() =>
  import('@/features/faculty/FacultyFormPage').then((m) => ({ default: m.FacultyFormPage })),
)
const FacultyDetailsPage = lazy(() =>
  import('@/features/faculty/FacultyDetailsPage').then((m) => ({ default: m.FacultyDetailsPage })),
)
const RoomsPage = lazy(() => import('@/features/rooms/RoomsPage').then((m) => ({ default: m.RoomsPage })))
const TimetablePage = lazy(() =>
  import('@/features/timetable/TimetablePage').then((m) => ({ default: m.TimetablePage })),
)
const PeriodSlotsPage = lazy(() =>
  import('@/features/timetable/PeriodSlotsPage').then((m) => ({ default: m.PeriodSlotsPage })),
)
const InstitutionPage = lazy(() =>
  import('@/features/institution/InstitutionPage').then((m) => ({ default: m.InstitutionPage })),
)
const AuditLogPage = lazy(() =>
  import('@/features/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)
const DocumentsPage = lazy(() =>
  import('@/features/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
)
const ImportExportPage = lazy(() =>
  import('@/features/import-export/ImportExportPage').then((m) => ({ default: m.ImportExportPage })),
)
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const RolesPage = lazy(() => import('@/features/rbac/RolesPage').then((m) => ({ default: m.RolesPage })))

function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="account/change-password" element={<ChangePasswordPage />} />
          <Route path="students">
            <Route index element={<StudentsPage />} />
            <Route path="new" element={<StudentFormPage />} />
            <Route path=":id" element={<StudentDetailsPage />} />
            <Route path=":id/edit" element={<StudentFormPage />} />
          </Route>
          <Route
            path="departments/*"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <DepartmentsPage />
              </RequireRole>
            }
          />
          <Route
            path="announcements"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <AnnouncementsPage />
              </RequireRole>
            }
          />
          <Route
            path="leave"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <LeavePage />
              </RequireRole>
            }
          />
          <Route path="assignments">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AssignmentsPage />
                </RequireRole>
              }
            />
            <Route
              path=":id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AssignmentDetailsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="attendance">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AttendancePage />
                </RequireRole>
              }
            />
            <Route
              path="corrections"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AttendanceCorrectionsPage />
                </RequireRole>
              }
            />
            <Route
              path="sessions/:id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AttendanceSessionPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="examinations">
            <Route
              index
              element={
                <RequireRole roles={EXAM_ROLES}>
                  <ExaminationsPage />
                </RequireRole>
              }
            />
            <Route
              path="schedules/:scheduleId"
              element={
                <RequireRole roles={EXAM_ROLES}>
                  <ExamScheduleMarksPage />
                </RequireRole>
              }
            />
            <Route
              path=":examId"
              element={
                <RequireRole roles={EXAM_ROLES}>
                  <ExamDetailsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="admissions">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AdmissionsPage />
                </RequireRole>
              }
            />
            <Route
              path=":id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <AdmissionApplicationDetailsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="placements">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <PlacementsPage />
                </RequireRole>
              }
            />
            <Route
              path=":id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <JobOpeningDetailsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="fees">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <FeesPage />
                </RequireRole>
              }
            />
            <Route
              path="invoices/:id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <FeeInvoiceDetailsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route
            path="hostel"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <HostelPage />
              </RequireRole>
            }
          />
          <Route
            path="transport"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <TransportPage />
              </RequireRole>
            }
          />
          <Route
            path="library"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <LibraryPage />
              </RequireRole>
            }
          />
          <Route
            path="certificates"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <CertificatesPage />
              </RequireRole>
            }
          />
          <Route
            path="activities"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <ActivitiesPage />
              </RequireRole>
            }
          />
          <Route
            path="billing"
            element={
              <RequireRole roles={PLATFORM_ADMIN_ROLES}>
                <BillingPage />
              </RequireRole>
            }
          />
          <Route
            path="developer"
            element={
              <RequireRole roles={PLATFORM_ADMIN_ROLES}>
                <DeveloperSettingsPage />
              </RequireRole>
            }
          />
          <Route
            path="approvals"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <ApprovalsPage />
              </RequireRole>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <NotificationsPage />
              </RequireRole>
            }
          />
          <Route
            path="class-groups"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <ClassGroupsPage />
              </RequireRole>
            }
          />
          <Route
            path="academic-years"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <AcademicYearsPage />
              </RequireRole>
            }
          />
          <Route
            path="programs"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <ProgramsPage />
              </RequireRole>
            }
          />
          <Route
            path="batches"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <BatchesPage />
              </RequireRole>
            }
          />
          <Route
            path="sections"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <SectionsPage />
              </RequireRole>
            }
          />
          <Route
            path="subjects"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <SubjectsPage />
              </RequireRole>
            }
          />
          <Route path="faculty">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <FacultyPage />
                </RequireRole>
              }
            />
            <Route
              path="new"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <FacultyFormPage />
                </RequireRole>
              }
            />
            <Route
              path=":id"
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <FacultyDetailsPage />
                </RequireRole>
              }
            />
            <Route
              path=":id/edit"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <FacultyFormPage />
                </RequireRole>
              }
            />
          </Route>
          <Route
            path="rooms"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <RoomsPage />
              </RequireRole>
            }
          />
          <Route path="timetable">
            <Route
              index
              element={
                <RequireRole roles={STAFF_ROLES}>
                  <TimetablePage />
                </RequireRole>
              }
            />
            <Route
              path="periods"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <PeriodSlotsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route
            path="institution"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <InstitutionPage />
              </RequireRole>
            }
          />
          <Route
            path="documents"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <DocumentsPage />
              </RequireRole>
            }
          />
          <Route
            path="import-export"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <ImportExportPage />
              </RequireRole>
            }
          />
          <Route
            path="reports"
            element={
              <RequireRole roles={EXAM_ROLES}>
                <ReportsPage />
              </RequireRole>
            }
          />
          <Route
            path="roles"
            element={
              <RequireRole roles={PLATFORM_ADMIN_ROLES}>
                <RolesPage />
              </RequireRole>
            }
          />
          <Route
            path="audit"
            element={
              <RequireRole roles={PLATFORM_ADMIN_ROLES}>
                <AuditLogPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
