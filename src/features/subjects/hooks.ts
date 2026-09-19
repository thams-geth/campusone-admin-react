import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import { listFaculty } from '@/services/api/facultyApi'
import { listPrograms } from '@/services/api/programsApi'
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
  type ListSubjectsParams,
  type SubjectInput,
} from '@/services/api/subjectsApi'

export function useSubjectsQuery(params: ListSubjectsParams) {
  return useQuery({
    queryKey: ['subjects', 'list', params],
    queryFn: () => listSubjects(params),
    placeholderData: (previous) => previous,
  })
}

/** All programs, for the program filter/select and for resolving program names in the table. */
export function useAllProgramsForSubjects() {
  return useQuery({
    queryKey: ['programs', 'all'],
    queryFn: () => listPrograms({ page: 1, pageSize: 100 }),
  })
}

/** All faculty, for the coordinating-faculty select and for resolving faculty names in the table. */
export function useAllFacultyForSubjects() {
  return useQuery({
    queryKey: ['faculty', 'all'],
    queryFn: () => listFaculty({ page: 1, pageSize: 100 }),
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: SubjectInput) => createSubject(input),
    onSuccess: () => {
      message.success('Subject created')
      void queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create subject'))
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubjectInput }) => updateSubject(id, input),
    onSuccess: () => {
      message.success('Subject updated')
      void queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update subject'))
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      message.success('Subject deleted')
      void queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete subject'))
    },
  })
}
