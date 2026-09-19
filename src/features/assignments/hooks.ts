import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  closeAssignment,
  createAssignment,
  deleteAssignment,
  evaluateAssignmentSubmission,
  getAssignment,
  listAssignmentSubmissions,
  listAssignments,
  publishAssignment,
  updateAssignment,
  type Assignment,
  type AssignmentInput,
  type EvaluateAssignmentSubmissionInput,
  type ListAssignmentSubmissionsParams,
  type ListAssignmentsParams,
} from '@/services/api/assignmentsApi'
import { listSections } from '@/services/api/sectionsApi'
import { listSubjects } from '@/services/api/subjectsApi'

export function useAssignmentsQuery(params: ListAssignmentsParams) {
  return useQuery({
    queryKey: ['assignments', 'list', params],
    queryFn: () => listAssignments(params),
    placeholderData: (previous) => previous,
  })
}

export function useAssignmentQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['assignments', 'detail', id],
    queryFn: () => getAssignment(id!),
    enabled: !!id,
  })
}

/** Section/subject pickers for filters and the form — small, unpaginated-in-practice lookups (page 1 of 100). */
export function useAllSectionsForAssignments() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useAllSubjectsForAssignments() {
  return useQuery({ queryKey: ['subjects', 'all'], queryFn: () => listSubjects({ page: 1, pageSize: 100 }) })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: AssignmentInput) => createAssignment(input),
    onSuccess: () => {
      message.success('Assignment created')
      void queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create assignment'))
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignmentInput }) => updateAssignment(id, input),
    onSuccess: () => {
      message.success('Assignment updated')
      void queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update assignment'))
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      message.success('Assignment deleted')
      void queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete assignment'))
    },
  })
}

export function usePublishAssignment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => publishAssignment(id),
    onSuccess: () => {
      message.success('Assignment published')
      void queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to publish assignment'))
    },
  })
}

export function useCloseAssignment() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => closeAssignment(id),
    onSuccess: () => {
      message.success('Assignment closed')
      void queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to close assignment'))
    },
  })
}

export function useAssignmentSubmissionsQuery(assignmentId: string | undefined, params: ListAssignmentSubmissionsParams = {}) {
  return useQuery({
    queryKey: ['assignments', 'submissions', assignmentId, params],
    queryFn: () => listAssignmentSubmissions(assignmentId!, params),
    enabled: !!assignmentId,
    placeholderData: (previous) => previous,
  })
}

export function useEvaluateAssignmentSubmission(assignmentId: string | undefined) {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ submissionId, input }: { submissionId: string; input: EvaluateAssignmentSubmissionInput }) =>
      evaluateAssignmentSubmission(submissionId, input),
    onSuccess: () => {
      message.success('Submission evaluated')
      void queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions', assignmentId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to evaluate submission'))
    },
  })
}

export type { Assignment }
