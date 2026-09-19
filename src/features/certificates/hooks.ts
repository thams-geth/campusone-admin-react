import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createCertificateRequest,
  createCertificateType,
  deleteCertificateType,
  issueCertificate,
  listCertificateRequests,
  listCertificateTypes,
  rejectCertificateRequest,
  verifyCertificate,
  type CertificateTypeInput,
  type CreateCertificateRequestInput,
  type ListCertificateRequestsParams,
  type RejectCertificateRequestInput,
} from '@/services/api/certificatesApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Certificate types ----

export function useCertificateTypesQuery() {
  return useQuery({
    queryKey: ['certificate-types', 'list'],
    queryFn: () => listCertificateTypes(),
  })
}

export function useCreateCertificateType() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CertificateTypeInput) => createCertificateType(input),
    onSuccess: () => {
      message.success('Certificate type created')
      void queryClient.invalidateQueries({ queryKey: ['certificate-types'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create certificate type'))
    },
  })
}

export function useDeleteCertificateType() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteCertificateType(id),
    onSuccess: () => {
      message.success('Certificate type deleted')
      void queryClient.invalidateQueries({ queryKey: ['certificate-types'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete certificate type'))
    },
  })
}

// ---- Certificate requests ----

export function useCertificateRequestsQuery(params: ListCertificateRequestsParams) {
  return useQuery({
    queryKey: ['certificate-requests', 'list', params],
    queryFn: () => listCertificateRequests(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for staff requesting on a student's behalf — small, unpaginated-in-practice lookup. */
export function useAllStudentsForCertificates() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useCreateCertificateRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateCertificateRequestInput) => createCertificateRequest(input),
    onSuccess: () => {
      message.success('Certificate request submitted')
      void queryClient.invalidateQueries({ queryKey: ['certificate-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to submit certificate request'))
    },
  })
}

export function useIssueCertificate() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => issueCertificate(id),
    onSuccess: () => {
      message.success('Certificate issued')
      void queryClient.invalidateQueries({ queryKey: ['certificate-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to issue certificate'))
    },
  })
}

export function useRejectCertificateRequest() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectCertificateRequestInput }) =>
      rejectCertificateRequest(id, input),
    onSuccess: () => {
      message.success('Certificate request rejected')
      void queryClient.invalidateQueries({ queryKey: ['certificate-requests'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject certificate request'))
    },
  })
}

export function useVerifyCertificate() {
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (code: string) => verifyCertificate(code),
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to verify certificate'))
    },
  })
}
