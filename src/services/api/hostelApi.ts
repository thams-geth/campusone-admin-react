import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Hostel module (`src/modules/hostel`) wire format
 * exactly — enum casing included, no lowercase translation. Dates stay ISO
 * strings.
 */

export type AllocationStatus = 'ACTIVE' | 'INACTIVE'

export interface Hostel {
  id: string
  tenantId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface HostelInput {
  name: string
}

export interface HostelRoom {
  id: string
  tenantId: string
  hostelId: string
  roomNumber: string
  capacity: number
  createdAt: string
  updatedAt: string
}

export interface HostelRoomInput {
  hostelId: string
  roomNumber: string
  capacity: number
}

export interface ListHostelRoomsParams {
  page?: number
  pageSize?: number
  hostelId?: string
}

export interface HostelAllocation {
  id: string
  tenantId: string
  studentId: string
  hostelRoomId: string
  bedNumber: number
  status: AllocationStatus
  startDate: string
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface HostelAllocationInput {
  studentId: string
  hostelRoomId: string
  startDate: string
}

export interface ListHostelAllocationsParams {
  page?: number
  pageSize?: number
  studentId?: string
  hostelRoomId?: string
  status?: AllocationStatus
}

/** Plain findMany, not paginated. */
export async function listHostels(): Promise<Hostel[]> {
  return http.get<Hostel[]>('/hostel/hostels')
}

export async function createHostel(input: HostelInput): Promise<Hostel> {
  return http.post<Hostel>('/hostel/hostels', input)
}

export async function deleteHostel(id: string): Promise<void> {
  await http.delete<void>(`/hostel/hostels/${id}`)
}

export async function listHostelRooms(params: ListHostelRoomsParams = {}): Promise<PaginatedResponse<HostelRoom>> {
  return http.get<PaginatedResponse<HostelRoom>>('/hostel/rooms', { ...params })
}

export async function createHostelRoom(input: HostelRoomInput): Promise<HostelRoom> {
  return http.post<HostelRoom>('/hostel/rooms', input)
}

export async function deleteHostelRoom(id: string): Promise<void> {
  await http.delete<void>(`/hostel/rooms/${id}`)
}

/** Requires HOSTEL_MANAGE — see listMyHostelAllocations for the self-service equivalent. */
export async function listHostelAllocations(
  params: ListHostelAllocationsParams = {},
): Promise<PaginatedResponse<HostelAllocation>> {
  return http.get<PaginatedResponse<HostelAllocation>>('/hostel/allocations', { ...params })
}

/** The caller's own allocations — resolved server-side from Student.userId, not paginated. */
export async function listMyHostelAllocations(): Promise<HostelAllocation[]> {
  return http.get<HostelAllocation[]>('/hostel/allocations/mine')
}

/** bedNumber is assigned server-side (first free bed in the room); capacity is enforced there too. */
export async function createHostelAllocation(input: HostelAllocationInput): Promise<HostelAllocation> {
  return http.post<HostelAllocation>('/hostel/allocations', input)
}

export async function vacateAllocation(id: string): Promise<HostelAllocation> {
  return http.post<HostelAllocation>(`/hostel/allocations/${id}/vacate`)
}
