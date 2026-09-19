import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's RoomStatus enum exactly — no lowercase translation. */
export type RoomStatus = 'ACTIVE' | 'INACTIVE'

export interface Room {
  id: string
  tenantId: string
  name: string
  code: string
  capacity: number | null
  status: RoomStatus
  createdAt: string
  updatedAt: string
}

export interface RoomInput {
  name: string
  code: string
  capacity?: number
  /** Defaults to `ACTIVE` server-side when omitted. */
  status?: RoomStatus
}

export interface ListRoomsParams extends PaginationParams {
  status?: RoomStatus
}

export async function listRooms(params: ListRoomsParams = {}): Promise<PaginatedResponse<Room>> {
  const { page, pageSize, search, status } = params
  return http.get<PaginatedResponse<Room>>('/rooms', { page, pageSize, search, status })
}

export async function getRoom(id: string): Promise<Room> {
  return http.get<Room>(`/rooms/${id}`)
}

export async function createRoom(input: RoomInput): Promise<Room> {
  return http.post<Room>('/rooms', input)
}

export async function updateRoom(id: string, input: RoomInput): Promise<Room> {
  return http.put<Room>(`/rooms/${id}`, input)
}

export async function deleteRoom(id: string): Promise<void> {
  await http.delete<void>(`/rooms/${id}`)
}
