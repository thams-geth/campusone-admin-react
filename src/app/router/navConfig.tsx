import type { ReactNode } from 'react'
import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BuildOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckSquareOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOutlined,
  HomeOutlined,
  IdcardOutlined,
  ImportOutlined,
  MessageOutlined,
  NotificationOutlined,
  PartitionOutlined,
  ProfileOutlined,
  ReadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import type { Role } from '@/types/user'

/** Segments the dashboard's nav card grid (see NavCardGrid) into sections; order here is display order. */
export const NAV_GROUPS = ['Overview', 'People', 'Academic Structure', 'Academics', 'Campus Operations', 'Administration'] as const
export type NavGroup = (typeof NAV_GROUPS)[number]

export interface NavItem {
  key: string
  path: string
  label: string
  icon: ReactNode
  roles: Role[]
  group: NavGroup
}

// Shared with App.tsx's RequireRole route guards, so nav visibility and
// route access can't drift apart from each other.
export const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'HOD', 'FACULTY', 'STAFF']
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'HOD']
export const EXAM_ROLES: Role[] = [...STAFF_ROLES, 'EXAM_ADMIN']
// Billing/API keys/Webhooks/Integrations grants stay at this tier only per
// campusone-api's rbac/permissions.ts — never extended to DEPARTMENT_ADMIN/
// HOD/STAFF, unlike the rest of this app's modules.
export const PLATFORM_ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN']

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined />, roles: STAFF_ROLES, group: 'Overview' },
  { key: 'students', path: '/students', label: 'Students', icon: <TeamOutlined />, roles: STAFF_ROLES, group: 'People' },
  { key: 'faculty', path: '/faculty', label: 'Faculty', icon: <IdcardOutlined />, roles: STAFF_ROLES, group: 'People' },
  {
    key: 'departments',
    path: '/departments',
    label: 'Departments',
    icon: <ApartmentOutlined />,
    roles: ADMIN_ROLES,
    group: 'Academic Structure',
  },
  {
    key: 'academic-years',
    path: '/academic-years',
    label: 'Academic Years',
    icon: <ScheduleOutlined />,
    roles: STAFF_ROLES,
    group: 'Academic Structure',
  },
  { key: 'programs', path: '/programs', label: 'Programs', icon: <ReadOutlined />, roles: STAFF_ROLES, group: 'Academic Structure' },
  { key: 'batches', path: '/batches', label: 'Batches', icon: <AppstoreOutlined />, roles: STAFF_ROLES, group: 'Academic Structure' },
  {
    key: 'sections',
    path: '/sections',
    label: 'Sections',
    icon: <PartitionOutlined />,
    roles: STAFF_ROLES,
    group: 'Academic Structure',
  },
  {
    key: 'subjects',
    path: '/subjects',
    label: 'Subjects',
    icon: <ProfileOutlined />,
    roles: STAFF_ROLES,
    group: 'Academic Structure',
  },
  { key: 'rooms', path: '/rooms', label: 'Rooms', icon: <BuildOutlined />, roles: STAFF_ROLES, group: 'Academic Structure' },
  {
    key: 'timetable',
    path: '/timetable',
    label: 'Timetable',
    icon: <FieldTimeOutlined />,
    roles: STAFF_ROLES,
    group: 'Academic Structure',
  },
  {
    key: 'institution',
    path: '/institution',
    label: 'Institution',
    icon: <SettingOutlined />,
    roles: STAFF_ROLES,
    group: 'Academic Structure',
  },
  { key: 'attendance', path: '/attendance', label: 'Attendance', icon: <CalendarOutlined />, roles: STAFF_ROLES, group: 'Academics' },
  { key: 'leave', path: '/leave', label: 'Leave', icon: <SolutionOutlined />, roles: STAFF_ROLES, group: 'Academics' },
  {
    key: 'assignments',
    path: '/assignments',
    label: 'Assignments',
    icon: <FileTextOutlined />,
    roles: STAFF_ROLES,
    group: 'Academics',
  },
  { key: 'examinations', path: '/examinations', label: 'Examinations', icon: <BookOutlined />, roles: EXAM_ROLES, group: 'Academics' },
  {
    key: 'announcements',
    path: '/announcements',
    label: 'Announcements',
    icon: <NotificationOutlined />,
    roles: STAFF_ROLES,
    group: 'Academics',
  },
  {
    key: 'class-groups',
    path: '/class-groups',
    label: 'Class Groups',
    icon: <MessageOutlined />,
    roles: STAFF_ROLES,
    group: 'Academics',
  },
  { key: 'documents', path: '/documents', label: 'Documents', icon: <FolderOutlined />, roles: STAFF_ROLES, group: 'Academics' },
  { key: 'reports', path: '/reports', label: 'Reports', icon: <BarChartOutlined />, roles: EXAM_ROLES, group: 'Academics' },
  {
    key: 'import-export',
    path: '/import-export',
    label: 'Import / Export',
    icon: <ImportOutlined />,
    roles: ADMIN_ROLES,
    group: 'Academics',
  },
  {
    key: 'admissions',
    path: '/admissions',
    label: 'Admissions',
    icon: <AuditOutlined />,
    roles: STAFF_ROLES,
    group: 'Campus Operations',
  },
  { key: 'fees', path: '/fees', label: 'Fees', icon: <DollarOutlined />, roles: STAFF_ROLES, group: 'Campus Operations' },
  { key: 'hostel', path: '/hostel', label: 'Hostel', icon: <HomeOutlined />, roles: STAFF_ROLES, group: 'Campus Operations' },
  { key: 'transport', path: '/transport', label: 'Transport', icon: <CarOutlined />, roles: STAFF_ROLES, group: 'Campus Operations' },
  { key: 'library', path: '/library', label: 'Library', icon: <BankOutlined />, roles: STAFF_ROLES, group: 'Campus Operations' },
  {
    key: 'certificates',
    path: '/certificates',
    label: 'Certificates',
    icon: <SafetyCertificateOutlined />,
    roles: STAFF_ROLES,
    group: 'Campus Operations',
  },
  {
    key: 'activities',
    path: '/activities',
    label: 'Activities',
    icon: <TrophyOutlined />,
    roles: STAFF_ROLES,
    group: 'Campus Operations',
  },
  {
    key: 'placements',
    path: '/placements',
    label: 'Placements',
    icon: <RocketOutlined />,
    roles: STAFF_ROLES,
    group: 'Campus Operations',
  },
  {
    key: 'billing',
    path: '/billing',
    label: 'Billing',
    icon: <CreditCardOutlined />,
    roles: PLATFORM_ADMIN_ROLES,
    group: 'Administration',
  },
  {
    key: 'developer',
    path: '/developer',
    label: 'Developer settings',
    icon: <ApiOutlined />,
    roles: PLATFORM_ADMIN_ROLES,
    group: 'Administration',
  },
  {
    key: 'approvals',
    path: '/approvals',
    label: 'Approvals',
    icon: <CheckSquareOutlined />,
    roles: STAFF_ROLES,
    group: 'Administration',
  },
  {
    key: 'notifications',
    path: '/notifications',
    label: 'Notifications',
    icon: <BellOutlined />,
    roles: STAFF_ROLES,
    group: 'Administration',
  },
  {
    key: 'roles',
    path: '/roles',
    label: 'Roles & Permissions',
    icon: <SafetyOutlined />,
    roles: PLATFORM_ADMIN_ROLES,
    group: 'Administration',
  },
  {
    key: 'audit',
    path: '/audit',
    label: 'Audit Log',
    icon: <FileSearchOutlined />,
    roles: PLATFORM_ADMIN_ROLES,
    group: 'Administration',
  },
]
