import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Announcements (Milestone 2) — in-app only, no SMS/WhatsApp/email/push
 * delivery yet. Wire format mirrors the backend exactly (uppercase enums,
 * ISO date strings).
 */

export type AnnouncementAudience = 'COLLEGE' | 'DEPARTMENT' | 'PROGRAM' | 'BATCH' | 'SECTION'
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Announcement {
  id: string
  tenantId: string
  title: string
  content: string
  authorUserId: string
  audience: AnnouncementAudience
  departmentId: string | null
  programId: string | null
  batchId: string | null
  sectionId: string | null
  priority: AnnouncementPriority
  publishAt: string
  expiryAt: string | null
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AnnouncementInput {
  title: string
  content: string
  audience: AnnouncementAudience
  /** Required when audience is DEPARTMENT. */
  departmentId?: string
  /** Required when audience is PROGRAM. */
  programId?: string
  /** Required when audience is BATCH. */
  batchId?: string
  /** Required when audience is SECTION. */
  sectionId?: string
  /** Defaults to MEDIUM server-side if omitted. */
  priority?: AnnouncementPriority
  /** Defaults to now server-side if omitted. */
  publishAt?: string
  expiryAt?: string
}

export interface ListAnnouncementsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  audience?: AnnouncementAudience
}

export async function listAnnouncements(
  params: ListAnnouncementsParams = {},
): Promise<PaginatedResponse<Announcement>> {
  return http.get<PaginatedResponse<Announcement>>('/announcements', { ...params })
}

/** The caller's personal feed — COLLEGE-wide plus whatever department/program/batch/section they belong to, currently published. Not paginated. */
export async function getAnnouncementFeed(): Promise<Announcement[]> {
  return http.get<Announcement[]>('/announcements/feed')
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  return http.get<Announcement>(`/announcements/${id}`)
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  return http.post<Announcement>('/announcements', input)
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement> {
  return http.put<Announcement>(`/announcements/${id}`, input)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await http.delete<void>(`/announcements/${id}`)
}
