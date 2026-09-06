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
