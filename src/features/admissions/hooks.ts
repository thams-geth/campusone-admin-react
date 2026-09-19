import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  advanceApplication,
  createAdmissionApplication,
  enrollApplicant,
  getAdmissionApplication,
  listAdmissionApplications,
  rejectApplication,
  withdrawApplication,
  type AdmissionApplicationInput,
  type AdmissionReviewInput,
  type EnrollApplicationInput,
  type ListAdmissionApplicationsParams,
} from '@/services/api/admissionsApi'
import { listPrograms } from '@/services/api/programsApi'
import { listSections } from '@/services/api/sectionsApi'

export function useAdmissionApplicationsQuery(params: ListAdmissionApplicationsParams) {
  return useQuery({
    queryKey: ['admissions', 'list', params],
    queryFn: () => listAdmissionApplications(params),
    placeholderData: (previous) => previous,
  })
}

export function useAdmissionApplicationQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['admissions', 'detail', id],
    queryFn: () => getAdmissionApplication(id!),
    enabled: !!id,
  })
}

/** Program picker for filters/forms — small, unpaginated-in-practice lookup (page 1 of 100). */
export function useAllPrograms() {
  return useQuery({ queryKey: ['programs', 'all'], queryFn: () => listPrograms({ page: 1, pageSize: 100 }) })
}

/** Section picker for the enroll form — optional field, small lookup. */
export function useAllSectionsForAdmissions() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useCreateAdmissionApplication() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: AdmissionApplicationInput) => createAdmissionApplication(input),
    onSuccess: () => {
      message.success('Application submitted')
      void queryClient.invalidateQueries({ queryKey: ['admissions'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to submit application'))
    },
  })
}

export function useAdvanceApplication() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: AdmissionReviewInput }) => advanceApplication(id, input),
    onSuccess: (data) => {
      message.success('Application advanced')
      void queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.setQueryData(['admissions', 'detail', data.id], data)
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to advance application'))
    },
  })
}

export function useRejectApplication() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: AdmissionReviewInput }) => rejectApplication(id, input),
    onSuccess: (data) => {
      message.success('Application rejected')
      void queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.setQueryData(['admissions', 'detail', data.id], data)
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject application'))
    },
  })
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => withdrawApplication(id),
    onSuccess: (data) => {
      message.success('Application withdrawn')
      void queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.setQueryData(['admissions', 'detail', data.id], data)
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to withdraw application'))
    },
  })
}

export function useEnrollApplicant() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EnrollApplicationInput }) => enrollApplicant(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admissions'] })
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to enroll applicant'))
    },
  })
}
