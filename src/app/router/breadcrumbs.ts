import { matchPath, useLocation } from 'react-router-dom'
import type { BreadcrumbProps } from 'antd'

interface BreadcrumbRoute {
  path: string
  title: string
}

const BREADCRUMB_ROUTES: BreadcrumbRoute[] = [
  { path: '/', title: 'Dashboard' },
  { path: '/students', title: 'Students' },
  { path: '/students/new', title: 'Add Student' },
  { path: '/students/:id', title: 'Student Details' },
  { path: '/students/:id/edit', title: 'Edit Student' },
  { path: '/departments', title: 'Departments' },
  { path: '/departments/new', title: 'Add Department' },
  { path: '/departments/:id/edit', title: 'Edit Department' },
  { path: '/attendance', title: 'Attendance' },
  { path: '/attendance/corrections', title: 'Corrections' },
  { path: '/attendance/sessions/:id', title: 'Session' },
  { path: '/leave', title: 'Leave' },
  { path: '/assignments', title: 'Assignments' },
  { path: '/assignments/:id', title: 'Assignment Details' },
  { path: '/examinations', title: 'Examinations' },
  { path: '/examinations/schedules/:scheduleId', title: 'Marks' },
  { path: '/examinations/:examId', title: 'Exam Details' },
  { path: '/announcements', title: 'Announcements' },
  { path: '/admissions', title: 'Admissions' },
  { path: '/admissions/:id', title: 'Application Details' },
  { path: '/fees', title: 'Fees' },
  { path: '/fees/invoices/:id', title: 'Invoice Details' },
  { path: '/hostel', title: 'Hostel' },
  { path: '/transport', title: 'Transport' },
  { path: '/library', title: 'Library' },
  { path: '/certificates', title: 'Certificates' },
  { path: '/activities', title: 'Activities' },
  { path: '/placements', title: 'Placements' },
  { path: '/billing', title: 'Billing' },
  { path: '/developer', title: 'Developer settings' },
  { path: '/approvals', title: 'Approvals' },
  { path: '/notifications', title: 'Notifications' },
  { path: '/class-groups', title: 'Class Groups' },
  { path: '/academic-years', title: 'Academic Years' },
  { path: '/programs', title: 'Programs' },
  { path: '/batches', title: 'Batches' },
  { path: '/sections', title: 'Sections' },
  { path: '/subjects', title: 'Subjects' },
  { path: '/faculty', title: 'Faculty' },
  { path: '/faculty/new', title: 'Add Faculty' },
  { path: '/faculty/:id/edit', title: 'Edit Faculty' },
  { path: '/rooms', title: 'Rooms' },
  { path: '/timetable', title: 'Timetable' },
  { path: '/institution', title: 'Institution' },
  { path: '/documents', title: 'Documents' },
  { path: '/import-export', title: 'Import / Export' },
  { path: '/reports', title: 'Reports' },
  { path: '/roles', title: 'Roles & Permissions' },
  { path: '/audit', title: 'Audit Log' },
]

export type BreadcrumbItem = NonNullable<BreadcrumbProps['items']>[number]

/** Builds a shallow breadcrumb trail (section + current page) from the URL. */
export function useBreadcrumbItems(): BreadcrumbItem[] {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return [{ title: 'Dashboard' }]

  const items: BreadcrumbItem[] = []
  const rootPath = `/${segments[0]}`
  const rootRoute = BREADCRUMB_ROUTES.find((route) => route.path === rootPath)
  if (rootRoute) items.push({ title: rootRoute.title })

  const currentRoute = BREADCRUMB_ROUTES.find((route) =>
    matchPath({ path: route.path, end: true }, location.pathname),
  )
  if (currentRoute && currentRoute.path !== rootPath) {
    items.push({ title: currentRoute.title })
  }

  return items
}
