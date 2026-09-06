import { networkDelay } from '@/services/mock/latency'
import { departmentsTable, studentsTable } from '@/services/mock/db'

export interface DashboardSummary {
  totalStudents: number
  activeStudents: number
  totalDepartments: number
  totalFaculty: number
  pendingAdmissions: number
}

export interface EnrollmentTrendPoint {
  month: string
  count: number
}

export interface DepartmentDistributionPoint {
  departmentId: string
  name: string
  code: string
  studentCount: number
}

export interface ActivityItem {
  id: string
  message: string
  actor: string
  timestamp: string
}

const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'act-1', message: 'added a new student to CSE', actor: 'Priya Nair', timestamp: daysAgo(0, 3) },
  { id: 'act-2', message: 'updated department details for MBA', actor: 'Vikram Shah', timestamp: daysAgo(0, 9) },
  { id: 'act-3', message: 'marked Physics department inactive', actor: 'Ananya Rao', timestamp: daysAgo(1, 2) },
  { id: 'act-4', message: 'added 3 new students to ECE', actor: 'Priya Nair', timestamp: daysAgo(2, 5) },
  { id: 'act-5', message: 'updated contact info for a Civil student', actor: 'Sneha Iyer', timestamp: daysAgo(3, 1) },
]

function daysAgo(days: number, hours: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await networkDelay()
  const { data: allStudents } = studentsTable.list({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })
  const { data: allDepartments } = departmentsTable.list({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })

  const activeDepartments = allDepartments.filter((d) => d.status === 'active')

  return {
    totalStudents: allStudents.length,
    activeStudents: allStudents.filter((s) => s.status === 'active').length,
    totalDepartments: activeDepartments.length,
    totalFaculty: activeDepartments.reduce((sum, d) => sum + d.facultyCount, 0),
    pendingAdmissions: 7,
  }
}

export async function getEnrollmentTrend(): Promise<EnrollmentTrendPoint[]> {
  await networkDelay()
  const { data: allStudents } = studentsTable.list({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })

  const counts = new Map<string, number>()
  for (const student of allStudents) {
    const date = new Date(student.admissionDate)
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, count]) => {
      const [year, month] = key.split('-')
      const label = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
      return { month: label, count }
    })
}

export async function getDepartmentDistribution(): Promise<DepartmentDistributionPoint[]> {
  await networkDelay()
  const { data: allStudents } = studentsTable.list({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })
  const { data: allDepartments } = departmentsTable.list({ page: 1, pageSize: Number.MAX_SAFE_INTEGER })

  return allDepartments
    .filter((d) => d.status === 'active')
    .map((dept) => ({
      departmentId: dept.id,
      name: dept.name,
      code: dept.code,
      studentCount: allStudents.filter((s) => s.departmentId === dept.id).length,
    }))
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  await networkDelay(200)
  return structuredClone(MOCK_RECENT_ACTIVITY)
}
