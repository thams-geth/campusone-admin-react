import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequireRole } from '@/features/auth/RouteGuards'
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

function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="students">
            <Route index element={<StudentsPage />} />
            <Route path="new" element={<StudentFormPage />} />
            <Route path=":id" element={<StudentDetailsPage />} />
            <Route path=":id/edit" element={<StudentFormPage />} />
          </Route>
          <Route
            path="departments/*"
            element={
              <RequireRole roles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN']}>
                <DepartmentsPage />
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
