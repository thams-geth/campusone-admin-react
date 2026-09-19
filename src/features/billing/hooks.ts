import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  cancelSubscription,
  createInvoice,
  getSubscription,
  getUsage,
  listInvoices,
  listPlans,
  payInvoice,
  setSubscription,
  type CreateInvoiceInput,
  type ListInvoicesParams,
  type SetSubscriptionInput,
} from '@/services/api/billingApi'

/** Read-only global catalogue — same reasoning as feesApi's structures, listed unpaginated for the plan picker. */
export function usePlansQuery() {
  return useQuery({ queryKey: ['billing', 'plans'], queryFn: () => listPlans() })
}

/**
 * getSubscription 404s ("No subscription found for this tenant") when the
 * tenant hasn't picked a plan yet — a real, expected first-time state, not
 * something to retry or crash on. `retry: false` so the 404 surfaces
 * immediately; BillingPage reads `query.error`'s status to show an empty
 * "pick a plan" state instead of the subscription card in that case.
 */
export function useSubscriptionQuery() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => getSubscription(),
    retry: false,
  })
}

export function useSetSubscription() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: SetSubscriptionInput) => setSubscription(input),
    onSuccess: () => {
      message.success('Subscription updated')
      void queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      void queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update subscription'))
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      message.success('Subscription set to cancel at period end')
      void queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to cancel subscription'))
    },
  })
}

export function useInvoicesQuery(params: ListInvoicesParams) {
  return useQuery({
    queryKey: ['billing', 'invoices', 'list', params],
    queryFn: () => listInvoices(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      message.success('Invoice created')
      void queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create invoice'))
    },
  })
}

export function usePayInvoice() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => payInvoice(id),
    onSuccess: () => {
      message.success('Invoice marked as paid')
      void queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to pay invoice'))
    },
  })
}

export function useUsageQuery() {
  return useQuery({ queryKey: ['billing', 'usage'], queryFn: () => getUsage() })
}
