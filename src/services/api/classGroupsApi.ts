import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * No separate ClassGroup entity — a Section already IS the class, so a
 * message just carries a sectionId. Membership (who can read/post
 * without CLASS_GROUP_MANAGE) is derived server-side from
 * Student.sectionId / TimetableEntry.facultyId — nothing to fetch or
 * manage for that on the client.
 */
export interface ClassGroupMessage {
  id: string
  tenantId: string
  sectionId: string
  authorUserId: string
  author: { id: string; name: string }
  body: string
  createdAt: string
}

export interface ListClassGroupMessagesParams {
  page?: number
  pageSize?: number
}

export interface PostClassGroupMessageInput {
  body: string
}

export async function listClassGroupMessages(
  sectionId: string,
  params: ListClassGroupMessagesParams = {},
): Promise<PaginatedResponse<ClassGroupMessage>> {
  const { page, pageSize } = params
  return http.get<PaginatedResponse<ClassGroupMessage>>(`/class-groups/${sectionId}/messages`, { page, pageSize })
}

export async function postClassGroupMessage(
  sectionId: string,
  input: PostClassGroupMessageInput,
): Promise<ClassGroupMessage> {
  return http.post<ClassGroupMessage>(`/class-groups/${sectionId}/messages`, input)
}
