import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createSection,
  deleteSection,
  listSections,
  updateSection,
  type ListSectionsParams,
  type SectionInput,
} from '@/services/api/sectionsApi'
import { listBatches } from '@/services/api/batchesApi'

const sectionsKey = (params: ListSectionsParams) => ['sections', 'list', params] as const

export function useSectionsQuery(params: ListSectionsParams) {
  return useQuery({
    queryKey: sectionsKey(params),
    queryFn: () => listSections(params),
    placeholderData: (previous) => previous,
  })
}

// ---- Lookups ----

export function useAllBatchesForSections() {
  return useQuery({ queryKey: ['batches', 'all'], queryFn: () => listBatches({ page: 1, pageSize: 100 }) })
}

// ---- Mutations ----

export function useCreateSection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: SectionInput) => createSection(input),
    onSuccess: () => {
      message.success('Section created')
      void queryClient.invalidateQueries({ queryKey: ['sections'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create section'))
    },
  })
}

export function useUpdateSection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SectionInput }) => updateSection(id, input),
    onSuccess: () => {
      message.success('Section updated')
      void queryClient.invalidateQueries({ queryKey: ['sections'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update section'))
    },
  })
}

export function useDeleteSection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteSection(id),
    onSuccess: () => {
      message.success('Section deleted')
      void queryClient.invalidateQueries({ queryKey: ['sections'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete section'))
    },
  })
}
