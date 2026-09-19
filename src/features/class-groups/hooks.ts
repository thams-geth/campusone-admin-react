import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  listClassGroupMessages,
  postClassGroupMessage,
  type ListClassGroupMessagesParams,
  type PostClassGroupMessageInput,
} from '@/services/api/classGroupsApi'
import { listSections } from '@/services/api/sectionsApi'
import { listBatches } from '@/services/api/batchesApi'

/** Section picker — small, unpaginated-in-practice lookup (page 1 of 100), same pattern as announcements' audience pickers. */
export function useAllSectionsForClassGroups() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

/** To label each section option with its batch name. */
export function useAllBatchesForClassGroups() {
  return useQuery({ queryKey: ['batches', 'all'], queryFn: () => listBatches({ page: 1, pageSize: 100 }) })
}

export function useClassGroupMessagesQuery(sectionId: string | undefined, params: ListClassGroupMessagesParams) {
  return useQuery({
    queryKey: ['class-groups', 'messages', sectionId, params],
    queryFn: () => listClassGroupMessages(sectionId as string, params),
    enabled: !!sectionId,
    placeholderData: (previous) => previous,
  })
}

export function usePostClassGroupMessage(sectionId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: PostClassGroupMessageInput) => postClassGroupMessage(sectionId as string, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['class-groups', 'messages', sectionId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to post message'))
    },
  })
}
