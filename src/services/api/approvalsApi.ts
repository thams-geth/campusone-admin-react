import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Minimal generic approval engine — not the full Workflow/WorkflowStep model; the six per-module approval flows elsewhere are untouched. */
export interface ApprovalRequest {
  id: string
  tenantId: string
  type: string
  entity: string
  entityId: string
  requestedByUserId: string
  status: ApprovalStatus
  reason: string | null
  decidedByUserId: string | null
  decidedAt: string | null
  decisionNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface ListApprovalsParams {
  page?: number
  pageSize?: number
  status?: ApprovalStatus
  type?: string
}

export interface CreateApprovalRequestInput {
  type: string
  entity: string
  entityId: string
  reason?: string
}

export interface DecideApprovalRequestInput {
  decisionNotes?: string
}

export async function listApprovals(params: ListApprovalsParams = {}): Promise<PaginatedResponse<ApprovalRequest>> {
  const { page, pageSize, status, type } = params
  return http.get<PaginatedResponse<ApprovalRequest>>('/approvals', { page, pageSize, status, type })
}

export async function createApprovalRequest(input: CreateApprovalRequestInput): Promise<ApprovalRequest> {
  return http.post<ApprovalRequest>('/approvals', input)
}

export async function approveRequest(id: string, input: DecideApprovalRequestInput = {}): Promise<ApprovalRequest> {
  return http.post<ApprovalRequest>(`/approvals/${id}/approve`, input)
}

export async function rejectRequest(id: string, input: DecideApprovalRequestInput = {}): Promise<ApprovalRequest> {
  return http.post<ApprovalRequest>(`/approvals/${id}/reject`, input)
}
