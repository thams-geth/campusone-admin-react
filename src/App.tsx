import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequireRole } from '@/features/auth/RouteGuards'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { StudentFormPage } from '@/features/students/StudentFormPage'
import { StudentDetailsPage } from '@/features/students/StudentDetailsPage'
import { DepartmentsPage } from '@/features/departments/DepartmentsPage'
import { NotFoundPage } from '@/components/common/NotFoundPage'

function App() {
  return (
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
  )
}

export default App
