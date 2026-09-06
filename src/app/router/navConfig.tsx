import type { ReactNode } from 'react'
import { ApartmentOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons'
import type { Role } from '@/types/user'

export interface NavItem {
  key: string
  path: string
  label: string
  icon: ReactNode
  roles: Role[]
}

const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY', 'STAFF']
const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN']

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined />, roles: STAFF_ROLES },
  { key: 'students', path: '/students', label: 'Students', icon: <TeamOutlined />, roles: STAFF_ROLES },
  { key: 'departments', path: '/departments', label: 'Departments', icon: <ApartmentOutlined />, roles: ADMIN_ROLES },
]
