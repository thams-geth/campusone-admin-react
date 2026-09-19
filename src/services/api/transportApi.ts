import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Transport module (`src/modules/transport`) wire
 * format exactly — enum casing included, no lowercase translation. Shares
 * the HOSTEL_TRANSPORT tenant module with hostelApi.ts. Dates stay ISO
 * strings.
 */

export type AllocationStatus = 'ACTIVE' | 'INACTIVE'

export interface Vehicle {
  id: string
  tenantId: string
  registrationNumber: string
  driverName: string
  driverPhone: string
  capacity: number
  createdAt: string
  updatedAt: string
}

export interface VehicleInput {
  registrationNumber: string
  driverName: string
  driverPhone: string
  capacity: number
}

export interface Stop {
  id: string
  tenantId: string
  routeId: string
  name: string
  sequence: number
  createdAt: string
}

export interface StopInput {
  name: string
  sequence: number
}

export interface Route {
  id: string
  tenantId: string
  name: string
  vehicleId?: string | null
  createdAt: string
  updatedAt: string
  /** listRoutes includes these, ordered by sequence. */
  stops: Stop[]
}

export interface RouteInput {
  name: string
  vehicleId?: string
}

export interface TransportAllocation {
  id: string
  tenantId: string
  studentId: string
  routeId: string
  stopId: string
  status: AllocationStatus
  createdAt: string
  updatedAt: string
}

export interface TransportAllocationInput {
  studentId: string
  routeId: string
  stopId: string
}

export interface ListTransportAllocationsParams {
  page?: number
  pageSize?: number
  studentId?: string
  routeId?: string
  status?: AllocationStatus
}

/** Plain findMany, not paginated. */
export async function listVehicles(): Promise<Vehicle[]> {
  return http.get<Vehicle[]>('/transport/vehicles')
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return http.post<Vehicle>('/transport/vehicles', input)
}

export async function deleteVehicle(id: string): Promise<void> {
  await http.delete<void>(`/transport/vehicles/${id}`)
}

/** Plain findMany (with stops included), not paginated. */
export async function listRoutes(): Promise<Route[]> {
  return http.get<Route[]>('/transport/routes')
}

export async function createRoute(input: RouteInput): Promise<Route> {
  return http.post<Route>('/transport/routes', input)
}

export async function deleteRoute(id: string): Promise<void> {
  await http.delete<void>(`/transport/routes/${id}`)
}

export async function addStop(routeId: string, input: StopInput): Promise<Stop> {
  return http.post<Stop>(`/transport/routes/${routeId}/stops`, input)
}

export async function deleteStop(id: string): Promise<void> {
  await http.delete<void>(`/transport/stops/${id}`)
}

/** Requires TRANSPORT_MANAGE — see listMyTransportAllocations for the self-service equivalent. */
export async function listTransportAllocations(
  params: ListTransportAllocationsParams = {},
): Promise<PaginatedResponse<TransportAllocation>> {
  return http.get<PaginatedResponse<TransportAllocation>>('/transport/allocations', { ...params })
}

/** The caller's own allocation — resolved server-side from Student.userId, not paginated. */
export async function listMyTransportAllocations(): Promise<TransportAllocation[]> {
  return http.get<TransportAllocation[]>('/transport/allocations/mine')
}

export async function createTransportAllocation(input: TransportAllocationInput): Promise<TransportAllocation> {
  return http.post<TransportAllocation>('/transport/allocations', input)
}

/** POST, not DELETE — the route is `/allocations/:id/remove`, marks the allocation INACTIVE rather than deleting it. */
export async function removeTransportAllocation(id: string): Promise<TransportAllocation> {
  return http.post<TransportAllocation>(`/transport/allocations/${id}/remove`)
}
