import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createFaculty,
  deleteFaculty,
  getFaculty,
  getFaculty360,
  listFaculty,
  updateFaculty,
  type FacultyCreateInput,
  type FacultyUpdateInput,
  type ListFacultyParams,
} from '@/services/api/facultyApi'
import { listDepartments } from '@/services/api/departmentsApi'

export function useFacultyQuery(params: ListFacultyParams) {
  return useQuery({
    queryKey: ['faculty', 'list', params],
    queryFn: () => listFaculty(params),
    placeholderData: (previous) => previous,
  })
}

export function useFacultyDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['faculty', 'detail', id],
    queryFn: () => getFaculty(id!),
    enabled: !!id,
  })
}

/** The cross-module 360 aggregation — an independent query, not a dependency of `useFacultyDetailQuery`. */
export function useFaculty360Query(id: string | undefined) {
  return useQuery({
    queryKey: ['faculty', 'detail', id, '360'],
    queryFn: () => getFaculty360(id!),
    enabled: !!id,
  })
}

/** All departments, for resolving names in the list and populating the form select — small, unpaginated-in-practice lookup (page 1 of 100). */
export function useAllDepartmentsForFaculty() {
  return useQuery({ queryKey: ['departments', 'all'], queryFn: () => listDepartments({ page: 1, pageSize: 100 }) })
}

export function useCreateFaculty() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: FacultyCreateInput) => createFaculty(input),
    onSuccess: () => {
      message.success('Faculty member added')
      void queryClient.invalidateQueries({ queryKey: ['faculty'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add faculty member'))
    },
  })
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FacultyUpdateInput }) => updateFaculty(id, input),
    onSuccess: () => {
      message.success('Faculty member updated')
      void queryClient.invalidateQueries({ queryKey: ['faculty'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update faculty member'))
    },
  })
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteFaculty(id),
    onSuccess: () => {
      message.success('Faculty member removed')
      void queryClient.invalidateQueries({ queryKey: ['faculty'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove faculty member'))
    },
  })
}
