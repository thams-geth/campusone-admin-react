import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Leave (Milestone 2) — integrated with Attendance: approving a request
 * updates any existing AttendanceRecord rows for that student in the date
 * range to ON_LEAVE. Balance is computed on read, not a stored ledger.
 * Wire format mirrors the backend exactly (uppercase enums, ISO dates).
 */

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LeaveType {
  id: string
  tenantId: string
  name: string
  defaultDaysPerYear: number
  createdAt: string
  updatedAt: string
}

export interface LeaveTypeInput {
  name: string
  defaultDaysPerYear: number
}

export interface LeaveRequest {
  id: string
  tenantId: string
  studentId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveRequestStatus
  reviewedByUserId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateLeaveRequestInput {
  /** Omit to resolve the caller's own Student profile; pass to let staff act on a student's behalf. */
  studentId?: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
}

export interface ListLeaveRequestsParams extends Pick<PaginationParams, 'page' | 'pageSize'> {
  studentId?: string
  status?: LeaveRequestStatus
}

export interface LeaveBalanceEntry {
  leaveTypeId: string
  leaveTypeName: string
  defaultDaysPerYear: number
  usedDays: number
  remainingDays: number
}

// ---- Leave types ----

export async function listLeaveTypes(
  params: Pick<PaginationParams, 'page' | 'pageSize'> = {},
): Promise<PaginatedResponse<LeaveType>> {
  return http.get<PaginatedResponse<LeaveType>>('/leave/types', { ...params })
}

export async function createLeaveType(input: LeaveTypeInput): Promise<LeaveType> {
  return http.post<LeaveType>('/leave/types', input)
}

export async function updateLeaveType(id: string, input: LeaveTypeInput): Promise<LeaveType> {
  return http.put<LeaveType>(`/leave/types/${id}`, input)
}

export async function deleteLeaveType(id: string): Promise<void> {
  await http.delete<void>(`/leave/types/${id}`)
}

// ---- Leave requests ----

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
  return http.post<LeaveRequest>('/leave/requests', input)
}

export async function listLeaveRequests(
  params: ListLeaveRequestsParams = {},
): Promise<PaginatedResponse<LeaveRequest>> {
  return http.get<PaginatedResponse<LeaveRequest>>('/leave/requests', { ...params })
}

export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  return http.get<LeaveRequest>(`/leave/requests/${id}`)
}

export async function approveLeaveRequest(id: string): Promise<LeaveRequest> {
  return http.post<LeaveRequest>(`/leave/requests/${id}/approve`)
}

export async function rejectLeaveRequest(id: string): Promise<LeaveRequest> {
  return http.post<LeaveRequest>(`/leave/requests/${id}/reject`)
}

// ---- Balance ----

export async function getLeaveBalance(studentId: string, year?: number): Promise<LeaveBalanceEntry[]> {
  return http.get<LeaveBalanceEntry[]>(`/leave/balance/${studentId}`, { year })
}
