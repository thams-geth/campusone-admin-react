import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

export interface WebhookEndpoint {
  id: string
  tenantId: string
  url: string
  /** Used to verify the HMAC signature on delivered payloads; returned by every read, not just create. */
  secret: string
  eventTypes: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateWebhookEndpointInput {
  url: string
  eventTypes: string[]
  enabled?: boolean
}

export interface UpdateWebhookEndpointInput {
  url?: string
  eventTypes?: string[]
  enabled?: boolean
}

export type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED'

export interface WebhookDelivery {
  id: string
  tenantId: string
  webhookEndpointId: string
  eventType: string
  payload: unknown
  status: WebhookDeliveryStatus
  attempts: number
  responseStatus: number | null
  lastAttemptAt: string | null
  createdAt: string
}

export interface ListDeliveriesParams {
  page?: number
  pageSize?: number
}

export async function listWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  return http.get<WebhookEndpoint[]>('/webhooks')
}

export async function createWebhookEndpoint(input: CreateWebhookEndpointInput): Promise<WebhookEndpoint> {
  return http.post<WebhookEndpoint>('/webhooks', input)
}

export async function updateWebhookEndpoint(id: string, input: UpdateWebhookEndpointInput): Promise<WebhookEndpoint> {
  return http.patch<WebhookEndpoint>(`/webhooks/${id}`, input)
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  await http.delete<void>(`/webhooks/${id}`)
}

export async function listWebhookDeliveries(
  endpointId: string,
  params: ListDeliveriesParams = {},
): Promise<PaginatedResponse<WebhookDelivery>> {
  const { page, pageSize } = params
  return http.get<PaginatedResponse<WebhookDelivery>>(`/webhooks/${endpointId}/deliveries`, { page, pageSize })
}
