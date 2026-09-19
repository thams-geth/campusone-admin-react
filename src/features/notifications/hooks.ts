import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  getUnreadNotificationCount,
  listNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationPreference,
  type ListNotificationsParams,
  type NotificationChannel,
  type SetNotificationPreferenceInput,
} from '@/services/api/notificationsApi'

export function useNotificationsQuery(params: ListNotificationsParams) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: () => listNotifications(params),
    placeholderData: (previous) => previous,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadNotificationCount(),
  })
}

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => listNotificationPreferences(),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to mark notification as read'))
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      message.success('All notifications marked as read')
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to mark all notifications as read'))
    },
  })
}

export function useSetNotificationPreference() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({
      channel,
      input,
    }: {
      channel: Exclude<NotificationChannel, 'IN_APP'>
      input: SetNotificationPreferenceInput
    }) => setNotificationPreference(channel, input),
    onSuccess: () => {
      message.success('Preference updated')
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update preference'))
    },
  })
}
