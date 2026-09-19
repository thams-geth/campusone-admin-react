import type { PaginatedResponse } from '@/types/common'
import { http } from '@/services/api/httpClient'

/**
 * Mirrors campusone-api's Fees module (`src/modules/fees`) wire format
 * exactly — enum casing included, no lowercase translation. This is an
 * internal ledger (`FeeStructure -> FeeInvoice -> Payment`), not a live
 * payment gateway integration; invoice `status` is recomputed server-side
 * on every ledger write, never trust a stale cached value after a mutation
 * — always use the response from the mutating call. Dates stay ISO strings.
 */

export type FeeCategory = 'TUITION' | 'HOSTEL' | 'TRANSPORT' | 'EXAM' | 'LIBRARY' | 'LAB' | 'OTHER'
export type FeeInvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED'
export type FeeAdjustmentType = 'DISCOUNT' | 'SCHOLARSHIP' | 'FINE'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE' | 'OTHER'

export interface FeeStructure {
  id: string
  tenantId: string
  programId: string
  academicYearId: string
  category: FeeCategory
  amount: number
  createdAt: string
  updatedAt: string
}

export interface FeeStructureInput {
  programId: string
  academicYearId: string
  category: FeeCategory
  amount: number
}

export interface ListFeeStructuresParams {
  page?: number
  pageSize?: number
  programId?: string
  academicYearId?: string
}

export interface FeeAdjustment {
  id: string
  tenantId: string
  invoiceId: string
  type: FeeAdjustmentType
  amount: number
  reason: string
  createdByUserId: string
  createdAt: string
}

export interface Payment {
  id: string
  tenantId: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  isRefund: boolean
  originalPaymentId?: string | null
  transactionRef?: string | null
  recordedByUserId: string
  createdAt: string
}

export interface FeeInvoice {
  id: string
  tenantId: string
  studentId: string
  feeStructureId?: string | null
  category: FeeCategory
  amount: number
  dueDate: string
  status: FeeInvoiceStatus
  createdAt: string
  updatedAt: string
  /** Only populated on getFeeInvoice and after a ledger-mutating call (addFeeAdjustment/waiveFeeInvoice). */
  adjustments?: FeeAdjustment[]
  payments?: Payment[]
}

export interface FeeInvoiceInput {
  studentId: string
  feeStructureId?: string
  category: FeeCategory
  amount: number
  dueDate: string
}

export interface ListFeeInvoicesParams {
  page?: number
  pageSize?: number
  studentId?: string
  status?: FeeInvoiceStatus
  category?: FeeCategory
}

export interface FeeAdjustmentInput {
  type: FeeAdjustmentType
  amount: number
  reason: string
}

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  transactionRef?: string
}

export interface RefundInput {
  amount: number
  reason: string
}

export async function listFeeStructures(
  params: ListFeeStructuresParams = {},
): Promise<PaginatedResponse<FeeStructure>> {
  return http.get<PaginatedResponse<FeeStructure>>('/fees/structures', { ...params })
}

export async function createFeeStructure(input: FeeStructureInput): Promise<FeeStructure> {
  return http.post<FeeStructure>('/fees/structures', input)
}

export async function deleteFeeStructure(id: string): Promise<void> {
  await http.delete<void>(`/fees/structures/${id}`)
}

/** Requires FEE_MANAGE — see listMyFeeInvoices for the self-service equivalent. */
export async function listFeeInvoices(params: ListFeeInvoicesParams = {}): Promise<PaginatedResponse<FeeInvoice>> {
  return http.get<PaginatedResponse<FeeInvoice>>('/fees/invoices', { ...params })
}

/** The caller's own invoices — resolved server-side from Student.userId, not paginated. */
export async function listMyFeeInvoices(): Promise<FeeInvoice[]> {
  return http.get<FeeInvoice[]>('/fees/invoices/mine')
}

export async function getFeeInvoice(id: string): Promise<FeeInvoice> {
  return http.get<FeeInvoice>(`/fees/invoices/${id}`)
}

export async function createFeeInvoice(input: FeeInvoiceInput): Promise<FeeInvoice> {
  return http.post<FeeInvoice>('/fees/invoices', input)
}

export async function addAdjustment(invoiceId: string, input: FeeAdjustmentInput): Promise<FeeInvoice> {
  return http.post<FeeInvoice>(`/fees/invoices/${invoiceId}/adjustments`, input)
}

export async function waiveInvoice(invoiceId: string): Promise<FeeInvoice> {
  return http.post<FeeInvoice>(`/fees/invoices/${invoiceId}/waive`)
}

export async function recordPayment(invoiceId: string, input: PaymentInput): Promise<Payment> {
  return http.post<Payment>(`/fees/invoices/${invoiceId}/payments`, input)
}

/** Creates a negative-direction Payment row tied back to the original via originalPaymentId. */
export async function refundPayment(paymentId: string, input: RefundInput): Promise<Payment> {
  return http.post<Payment>(`/fees/payments/${paymentId}/refund`, input)
}
