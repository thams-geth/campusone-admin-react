import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Mounted at `/audit-logs` (see campusone-api's app.ts: `v1.use('/audit-logs', auditRouter)`). */
export interface AuditLog {
  id: string
  tenantId: string
  actorUserId: string | null
  actorName: string
  message: string
  entity: string | null
  entityId: string | null
  action: string | null
  before: unknown
  after: unknown
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: string
}

export interface ListAuditLogsParams {
  page?: number
  pageSize?: number
  entity?: string
  entityId?: string
  actorUserId?: string
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<PaginatedResponse<AuditLog>> {
  const { page, pageSize, entity, entityId, actorUserId } = params
  return http.get<PaginatedResponse<AuditLog>>('/audit-logs', { page, pageSize, entity, entityId, actorUserId })
}
