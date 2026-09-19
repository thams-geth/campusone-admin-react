import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import { listDepartments } from '@/services/api/departmentsApi'
import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
  type ListProgramsParams,
  type ProgramInput,
} from '@/services/api/programsApi'

export function useProgramsQuery(params: ListProgramsParams) {
  return useQuery({
    queryKey: ['programs', 'list', params],
    queryFn: () => listPrograms(params),
    placeholderData: (previous) => previous,
  })
}

/** All programs (active + inactive), for resolving names in other modules' lists — e.g. Subjects. */
export function useAllPrograms() {
  return useQuery({
    queryKey: ['programs', 'all'],
    queryFn: () => listPrograms({ page: 1, pageSize: 100 }),
  })
}

/** All departments, for the department filter/select and for resolving department names in the table. */
export function useAllDepartmentsForPrograms() {
  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => listDepartments({ page: 1, pageSize: 100 }),
  })
}

export function useCreateProgram() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: ProgramInput) => createProgram(input),
    onSuccess: () => {
      message.success('Program created')
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create program'))
    },
  })
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProgramInput }) => updateProgram(id, input),
    onSuccess: () => {
      message.success('Program updated')
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update program'))
    },
  })
}

export function useDeleteProgram() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: () => {
      message.success('Program deleted')
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete program'))
    },
  })
}
