import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Read-only global catalogue — seeded by the platform, not tenant-authored. No create/update. */
export interface Plan {
  id: string
  name: string
  studentLimit: number
  facultyLimit: number
  priceMonthly: number
  description: string | null
  createdAt: string
  updatedAt: string
}

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  plan: Plan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface SetSubscriptionInput {
  planId: string
}

export type BillingInvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface BillingInvoice {
  id: string
  tenantId: string
  subscriptionId: string
  amount: number
  status: BillingInvoiceStatus
  periodStart: string
  periodEnd: string
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListInvoicesParams {
  page?: number
  pageSize?: number
  status?: BillingInvoiceStatus
}

export interface CreateInvoiceInput {
  /** Defaults to the current plan's monthly price when omitted. */
  amount?: number
  periodStart: string
  periodEnd: string
}

export interface BillingUsage {
  plan: string | null
  students: { used: number; limit: number | null }
  faculty: { used: number; limit: number | null }
}

export async function listPlans(): Promise<Plan[]> {
  return http.get<Plan[]>('/billing/plans')
}

export async function getSubscription(): Promise<Subscription> {
  return http.get<Subscription>('/billing/subscription')
}

export async function setSubscription(input: SetSubscriptionInput): Promise<Subscription> {
  return http.put<Subscription>('/billing/subscription', input)
}

export async function cancelSubscription(): Promise<Subscription> {
  return http.post<Subscription>('/billing/subscription/cancel')
}

export async function listInvoices(params: ListInvoicesParams = {}): Promise<PaginatedResponse<BillingInvoice>> {
  const { page, pageSize, status } = params
  return http.get<PaginatedResponse<BillingInvoice>>('/billing/invoices', { page, pageSize, status })
}

export async function createInvoice(input: CreateInvoiceInput): Promise<BillingInvoice> {
  return http.post<BillingInvoice>('/billing/invoices', input)
}

export async function payInvoice(id: string): Promise<BillingInvoice> {
  return http.post<BillingInvoice>(`/billing/invoices/${id}/pay`)
}

export async function getUsage(): Promise<BillingUsage> {
  return http.get<BillingUsage>('/billing/usage')
}
