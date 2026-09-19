import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createDocument,
  deleteDocument,
  listDocuments,
  rejectDocument,
  updateDocument,
  verifyDocument,
  type DocumentInput,
  type ListDocumentsParams,
} from '@/services/api/documentsApi'
import { listStudents } from '@/services/api/studentsApi'
import { listFaculty } from '@/services/api/facultyApi'
import { listAdmissionApplications } from '@/services/api/admissionsApi'

export function useDocumentsQuery(params: ListDocumentsParams) {
  return useQuery({
    queryKey: ['documents', 'list', params],
    queryFn: () => listDocuments(params),
    placeholderData: (previous) => previous,
  })
}

/** Owner pickers/name-resolution — small, unpaginated-in-practice lookups (page 1 of 100), one per ownerType. */
export function useAllStudentsForDocuments() {
  return useQuery({ queryKey: ['students', 'all'], queryFn: () => listStudents({ page: 1, pageSize: 100 }) })
}

export function useAllFacultyForDocuments() {
  return useQuery({ queryKey: ['faculty', 'all'], queryFn: () => listFaculty({ page: 1, pageSize: 100 }) })
}

export function useAllApplicantsForDocuments() {
  return useQuery({
    queryKey: ['admission-applications', 'all'],
    queryFn: () => listAdmissionApplications({ page: 1, pageSize: 100 }),
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: DocumentInput) => createDocument(input),
    onSuccess: () => {
      message.success('Document added')
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add document'))
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DocumentInput }) => updateDocument(id, input),
    onSuccess: () => {
      message.success('Document updated')
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update document'))
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      message.success('Document deleted')
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete document'))
    },
  })
}

export function useVerifyDocument() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => verifyDocument(id),
    onSuccess: () => {
      message.success('Document verified')
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to verify document'))
    },
  })
}

export function useRejectDocument() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => rejectDocument(id),
    onSuccess: () => {
      message.success('Document rejected')
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject document'))
    },
  })
}
