import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'

export interface Notification {
  id: string
  tenantId: string
  userId: string
  type: string
  title: string
  body: string
  entity: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

export interface ListNotificationsParams {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
}

/** IN_APP has no row here (it can't be disabled — no route exposes it) and never appears in this list. */
export interface NotificationPreference {
  channel: Exclude<NotificationChannel, 'IN_APP'>
  enabled: boolean
}

export interface SetNotificationPreferenceInput {
  enabled: boolean
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<PaginatedResponse<Notification>> {
  const { page, pageSize, unreadOnly } = params
  return http.get<PaginatedResponse<Notification>>('/notifications', { page, pageSize, unreadOnly })
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await http.get<{ count: number }>('/notifications/unread-count')
  return result.count
}

export async function markNotificationRead(id: string): Promise<void> {
  await http.post<void>(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.post<void>('/notifications/read-all')
}

export async function listNotificationPreferences(): Promise<NotificationPreference[]> {
  return http.get<NotificationPreference[]>('/notifications/preferences')
}

export async function setNotificationPreference(
  channel: Exclude<NotificationChannel, 'IN_APP'>,
  input: SetNotificationPreferenceInput,
): Promise<NotificationPreference> {
  return http.put<NotificationPreference>(`/notifications/preferences/${channel}`, input)
}
