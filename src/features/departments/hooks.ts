import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { ApiError } from '@/types/common'
import type { DepartmentInput } from '@/types/department'
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type ListDepartmentsParams,
} from '@/services/api/departmentsApi'

const departmentsKey = (params: ListDepartmentsParams) => ['departments', 'list', params] as const

export function useDepartmentsQuery(params: ListDepartmentsParams) {
  return useQuery({
    queryKey: departmentsKey(params),
    queryFn: () => listDepartments(params),
    placeholderData: (previous) => previous,
  })
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: DepartmentInput) => createDepartment(input),
    onSuccess: () => {
      message.success('Department created')
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create department'))
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DepartmentInput }) => updateDepartment(id, input),
    onSuccess: () => {
      message.success('Department updated')
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update department'))
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      message.success('Department deleted')
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete department'))
    },
  })
}
