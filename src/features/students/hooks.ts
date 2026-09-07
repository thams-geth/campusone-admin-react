import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { ApiError } from '@/types/common'
import type { StudentInput } from '@/types/student'
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
  type ListStudentsParams,
} from '@/services/api/studentsApi'
import { listDepartments } from '@/services/api/departmentsApi'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function useStudentsQuery(params: ListStudentsParams) {
  return useQuery({
    queryKey: ['students', 'list', params],
    queryFn: () => listStudents(params),
    placeholderData: (previous) => previous,
  })
}

export function useStudentQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['students', 'detail', id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
  })
}

/** All departments (active + inactive), for resolving names in lists/detail views. */
export function useAllDepartments() {
  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => listDepartments({ page: 1, pageSize: 100 }),
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: StudentInput) => createStudent(input),
    onSuccess: () => {
      message.success('Student added')
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add student'))
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StudentInput }) => updateStudent(id, input),
    onSuccess: () => {
      message.success('Student updated')
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update student'))
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      message.success('Student removed')
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove student'))
    },
  })
}
