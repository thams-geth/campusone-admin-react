import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
  type BatchInput,
  type ListBatchesParams,
} from '@/services/api/batchesApi'
import { listPrograms } from '@/services/api/programsApi'
import { listAcademicYears } from '@/services/api/academicYearsApi'

const batchesKey = (params: ListBatchesParams) => ['batches', 'list', params] as const

export function useBatchesQuery(params: ListBatchesParams) {
  return useQuery({
    queryKey: batchesKey(params),
    queryFn: () => listBatches(params),
    placeholderData: (previous) => previous,
  })
}

// ---- Lookups ----

export function useAllProgramsForBatches() {
  return useQuery({ queryKey: ['programs', 'all'], queryFn: () => listPrograms({ page: 1, pageSize: 100 }) })
}

export function useAllAcademicYearsForBatches() {
  return useQuery({
    queryKey: ['academic-years', 'all'],
    queryFn: () => listAcademicYears({ page: 1, pageSize: 100 }),
  })
}

// ---- Mutations ----

export function useCreateBatch() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: BatchInput) => createBatch(input),
    onSuccess: () => {
      message.success('Batch created')
      void queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create batch'))
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BatchInput }) => updateBatch(id, input),
    onSuccess: () => {
      message.success('Batch updated')
      void queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update batch'))
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteBatch(id),
    onSuccess: () => {
      message.success('Batch deleted')
      void queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete batch'))
    },
  })
}
