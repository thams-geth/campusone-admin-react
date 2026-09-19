import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Student Activities module
 * (`src/modules/activities`) wire format exactly — enum casing included, no
 * lowercase translation. This is the roadmap's "Student Activities"
 * (achievements/events/clubs/sports/competitions/internships), a single
 * lightweight record type self-reportable by the student or recorded by
 * staff. Dates stay ISO strings.
 */

export type ActivityType = 'ACHIEVEMENT' | 'EVENT' | 'CLUB' | 'SPORTS' | 'COMPETITION' | 'INTERNSHIP' | 'OTHER'

export interface StudentActivity {
  id: string
  tenantId: string
  studentId: string
  type: ActivityType
  title: string
  description?: string | null
  date: string
  certificateUrl?: string | null
  createdAt: string
  updatedAt: string
}

/** studentId is optional — omit it to self-report against the caller's own linked Student record. */
export interface ActivityInput {
  studentId?: string
  type: ActivityType
  title: string
  description?: string
  date: string
  certificateUrl?: string
}

export interface ListActivitiesParams {
  page?: number
  pageSize?: number
  studentId?: string
  type?: ActivityType
}

/** Requires ACTIVITY_MANAGE — see listMyActivities for the self-service equivalent. */
export async function listActivities(params: ListActivitiesParams = {}): Promise<PaginatedResponse<StudentActivity>> {
  return http.get<PaginatedResponse<StudentActivity>>('/activities', { ...params })
}

/** The caller's own activities — resolved server-side from Student.userId, not paginated. */
export async function listMyActivities(): Promise<StudentActivity[]> {
  return http.get<StudentActivity[]>('/activities/mine')
}

export async function getActivity(id: string): Promise<StudentActivity> {
  return http.get<StudentActivity>(`/activities/${id}`)
}

/** Grants ACTIVITY_MANAGE OR ACTIVITY_SELF_REPORT — a student can create their own with no explicit studentId. */
export async function createActivity(input: ActivityInput): Promise<StudentActivity> {
  return http.post<StudentActivity>('/activities', input)
}

export async function updateActivity(id: string, input: ActivityInput): Promise<StudentActivity> {
  return http.put<StudentActivity>(`/activities/${id}`, input)
}

export async function deleteActivity(id: string): Promise<void> {
  await http.delete<void>(`/activities/${id}`)
}
