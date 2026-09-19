import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type Announcement,
  type AnnouncementInput,
  type ListAnnouncementsParams,
} from '@/services/api/announcementsApi'
import { listDepartments } from '@/services/api/departmentsApi'
import { listPrograms } from '@/services/api/programsApi'
import { listBatches } from '@/services/api/batchesApi'
import { listSections } from '@/services/api/sectionsApi'

export function useAnnouncementsQuery(params: ListAnnouncementsParams) {
  return useQuery({
    queryKey: ['announcements', 'list', params],
    queryFn: () => listAnnouncements(params),
    placeholderData: (previous) => previous,
  })
}

/** Audience-target pickers for the form — small, unpaginated-in-practice lookups (page 1 of 100). */
export function useAllPrograms() {
  return useQuery({ queryKey: ['programs', 'all'], queryFn: () => listPrograms({ page: 1, pageSize: 100 }) })
}

export function useAllBatches() {
  return useQuery({ queryKey: ['batches', 'all'], queryFn: () => listBatches({ page: 1, pageSize: 100 }) })
}

export function useAllSections() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useAllDepartmentsForAnnouncements() {
  return useQuery({ queryKey: ['departments', 'all'], queryFn: () => listDepartments({ page: 1, pageSize: 100 }) })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: AnnouncementInput) => createAnnouncement(input),
    onSuccess: () => {
      message.success('Announcement created')
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create announcement'))
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AnnouncementInput }) => updateAnnouncement(id, input),
    onSuccess: () => {
      message.success('Announcement updated')
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update announcement'))
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      message.success('Announcement deleted')
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete announcement'))
    },
  })
}

export type { Announcement }
