import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  approveRequest,
  listApprovals,
  rejectRequest,
  type DecideApprovalRequestInput,
  type ListApprovalsParams,
} from '@/services/api/approvalsApi'

export function useApprovalsQuery(params: ListApprovalsParams) {
  return useQuery({
    queryKey: ['approvals', 'list', params],
    queryFn: () => listApprovals(params),
    placeholderData: (previous) => previous,
  })
}

export function useApproveRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: DecideApprovalRequestInput }) => approveRequest(id, input),
    onSuccess: () => {
      message.success('Request approved')
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to approve request'))
    },
  })
}

export function useRejectRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: DecideApprovalRequestInput }) => rejectRequest(id, input),
    onSuccess: () => {
      message.success('Request rejected')
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject request'))
    },
  })
}
