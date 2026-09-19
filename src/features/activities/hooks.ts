import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
  type ActivityInput,
  type ListActivitiesParams,
} from '@/services/api/activitiesApi'
import { listStudents } from '@/services/api/studentsApi'

export function useActivitiesQuery(params: ListActivitiesParams) {
  return useQuery({
    queryKey: ['activities', 'list', params],
    queryFn: () => listActivities(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for staff recording an activity on a student's behalf — small, unpaginated-in-practice lookup. */
export function useAllStudentsForActivities() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(input),
    onSuccess: () => {
      message.success('Activity added')
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add activity'))
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActivityInput }) => updateActivity(id, input),
    onSuccess: () => {
      message.success('Activity updated')
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update activity'))
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      message.success('Activity deleted')
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete activity'))
    },
  })
}
