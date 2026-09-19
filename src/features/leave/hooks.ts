import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  approveLeaveRequest,
  createLeaveRequest,
  createLeaveType,
  deleteLeaveType,
  listLeaveRequests,
  listLeaveTypes,
  rejectLeaveRequest,
  updateLeaveType,
  type CreateLeaveRequestInput,
  type ListLeaveRequestsParams,
  type LeaveTypeInput,
} from '@/services/api/leaveApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Leave requests ----

export function useLeaveRequestsQuery(params: ListLeaveRequestsParams) {
  return useQuery({
    queryKey: ['leave-requests', 'list', params],
    queryFn: () => listLeaveRequests(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for staff creating a request on a student's behalf — small, unpaginated-in-practice lookup. */
export function useAllStudentsForLeave() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateLeaveRequestInput) => createLeaveRequest(input),
    onSuccess: () => {
      message.success('Leave request submitted')
      void queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to submit leave request'))
    },
  })
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => approveLeaveRequest(id),
    onSuccess: () => {
      message.success('Leave request approved')
      void queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to approve leave request'))
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => rejectLeaveRequest(id),
    onSuccess: () => {
      message.success('Leave request rejected')
      void queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject leave request'))
    },
  })
}

// ---- Leave types ----

export function useLeaveTypesQuery() {
  return useQuery({
    queryKey: ['leave-types', 'list'],
    queryFn: () => listLeaveTypes({ page: 1, pageSize: 100 }),
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: LeaveTypeInput) => createLeaveType(input),
    onSuccess: () => {
      message.success('Leave type created')
      void queryClient.invalidateQueries({ queryKey: ['leave-types'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create leave type'))
    },
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveTypeInput }) => updateLeaveType(id, input),
    onSuccess: () => {
      message.success('Leave type updated')
      void queryClient.invalidateQueries({ queryKey: ['leave-types'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update leave type'))
    },
  })
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteLeaveType(id),
    onSuccess: () => {
      message.success('Leave type deleted')
      void queryClient.invalidateQueries({ queryKey: ['leave-types'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete leave type'))
    },
  })
}
