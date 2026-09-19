import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createAcademicYear,
  deleteAcademicYear,
  listAcademicYears,
  updateAcademicYear,
  type AcademicYearInput,
  type ListAcademicYearsParams,
} from '@/services/api/academicYearsApi'

const academicYearsKey = (params: ListAcademicYearsParams) => ['academic-years', 'list', params] as const

export function useAcademicYearsQuery(params: ListAcademicYearsParams) {
  return useQuery({
    queryKey: academicYearsKey(params),
    queryFn: () => listAcademicYears(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: AcademicYearInput) => createAcademicYear(input),
    onSuccess: () => {
      message.success('Academic year created')
      void queryClient.invalidateQueries({ queryKey: ['academic-years'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create academic year'))
    },
  })
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AcademicYearInput }) => updateAcademicYear(id, input),
    onSuccess: () => {
      message.success('Academic year updated')
      void queryClient.invalidateQueries({ queryKey: ['academic-years'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update academic year'))
    },
  })
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteAcademicYear(id),
    onSuccess: () => {
      message.success('Academic year deleted')
      void queryClient.invalidateQueries({ queryKey: ['academic-years'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete academic year'))
    },
  })
}
