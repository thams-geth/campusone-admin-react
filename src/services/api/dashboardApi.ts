import { http } from '@/services/api/httpClient'

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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return http.get<DashboardSummary>('/dashboard/summary')
}

export async function getEnrollmentTrend(): Promise<EnrollmentTrendPoint[]> {
  return http.get<EnrollmentTrendPoint[]>('/dashboard/trend')
}

export async function getDepartmentDistribution(): Promise<DepartmentDistributionPoint[]> {
  return http.get<DepartmentDistributionPoint[]>('/dashboard/distribution')
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  return http.get<ActivityItem[]>('/dashboard/activity')
}
