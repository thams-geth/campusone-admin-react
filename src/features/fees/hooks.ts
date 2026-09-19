import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  addAdjustment,
  createFeeInvoice,
  createFeeStructure,
  deleteFeeStructure,
  getFeeInvoice,
  listFeeInvoices,
  listFeeStructures,
  recordPayment,
  refundPayment,
  waiveInvoice,
  type FeeAdjustmentInput,
  type FeeInvoiceInput,
  type FeeStructureInput,
  type ListFeeInvoicesParams,
  type ListFeeStructuresParams,
  type PaymentInput,
  type RefundInput,
} from '@/services/api/feesApi'
import { listStudents } from '@/services/api/studentsApi'
import { listPrograms } from '@/services/api/programsApi'
import { listAcademicYears } from '@/services/api/academicYearsApi'

// ---- Lookups ----

/** Student picker for the invoice form — small, unpaginated-in-practice lookup, same pattern as other modules. */
export function useAllStudentsForFees() {
  return useQuery({ queryKey: ['students', 'all'], queryFn: () => listStudents({ page: 1, pageSize: 100 }) })
}

export function useAllFeeStructuresForFees() {
  return useQuery({
    queryKey: ['fees', 'structures', 'all'],
    queryFn: () => listFeeStructures({ page: 1, pageSize: 100 }),
  })
}

export function useAllProgramsForFees() {
  return useQuery({ queryKey: ['programs', 'all'], queryFn: () => listPrograms({ page: 1, pageSize: 100 }) })
}

export function useAllAcademicYearsForFees() {
  return useQuery({
    queryKey: ['academic-years', 'all'],
    queryFn: () => listAcademicYears({ page: 1, pageSize: 100 }),
  })
}

// ---- Fee invoices ----

export function useFeeInvoicesQuery(params: ListFeeInvoicesParams) {
  return useQuery({
    queryKey: ['fees', 'invoices', 'list', params],
    queryFn: () => listFeeInvoices(params),
    placeholderData: (previous) => previous,
  })
}

export function useFeeInvoiceQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['fees', 'invoices', 'detail', id],
    queryFn: () => getFeeInvoice(id!),
    enabled: !!id,
  })
}

export function useCreateFeeInvoice() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: FeeInvoiceInput) => createFeeInvoice(input),
    onSuccess: () => {
      message.success('Invoice created')
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create invoice'))
    },
  })
}

/**
 * recordPayment/refundPayment return only the created Payment row, not the
 * updated invoice — unlike addAdjustment/waiveInvoice, which return the
 * recomputed FeeInvoice directly. So for those two we can't "use the
 * response body" to update the cached invoice; instead we invalidate the
 * invoice detail query so it refetches the recomputed status + full
 * payments/adjustments arrays from the server.
 */
export function useRecordPayment(invoiceId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: PaymentInput) => recordPayment(invoiceId!, input),
    onSuccess: () => {
      message.success('Payment recorded')
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'detail', invoiceId] })
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to record payment'))
    },
  })
}

export function useRefundPayment(invoiceId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: RefundInput }) => refundPayment(paymentId, input),
    onSuccess: () => {
      message.success('Payment refunded')
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'detail', invoiceId] })
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to refund payment'))
    },
  })
}

/** addAdjustment/waiveInvoice both return the recomputed FeeInvoice — write the response straight into the detail cache. */
export function useAddAdjustment(invoiceId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: FeeAdjustmentInput) => addAdjustment(invoiceId!, input),
    onSuccess: (invoice) => {
      message.success('Adjustment added')
      queryClient.setQueryData(['fees', 'invoices', 'detail', invoiceId], invoice)
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add adjustment'))
    },
  })
}

export function useWaiveInvoice(invoiceId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: () => waiveInvoice(invoiceId!),
    onSuccess: (invoice) => {
      message.success('Invoice waived')
      queryClient.setQueryData(['fees', 'invoices', 'detail', invoiceId], invoice)
      void queryClient.invalidateQueries({ queryKey: ['fees', 'invoices', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to waive invoice'))
    },
  })
}

// ---- Fee structures ----

export function useFeeStructuresQuery(params: ListFeeStructuresParams) {
  return useQuery({
    queryKey: ['fees', 'structures', 'list', params],
    queryFn: () => listFeeStructures(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: FeeStructureInput) => createFeeStructure(input),
    onSuccess: () => {
      message.success('Fee structure created')
      void queryClient.invalidateQueries({ queryKey: ['fees', 'structures'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create fee structure'))
    },
  })
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteFeeStructure(id),
    onSuccess: () => {
      message.success('Fee structure deleted')
      void queryClient.invalidateQueries({ queryKey: ['fees', 'structures'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete fee structure'))
    },
  })
}
