import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createCompany,
  createJobOpening,
  deleteCompany,
  deleteJobOpening,
  getJobOpening,
  listApplications,
  listCompanies,
  listJobOpenings,
  updateApplicationStatus,
  type CompanyInput,
  type JobOpeningInput,
  type ListApplicationsParams,
  type ListJobOpeningsParams,
  type UpdateApplicationStatusInput,
} from '@/services/api/placementsApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Companies ----

export function useCompaniesQuery() {
  return useQuery({ queryKey: ['placement-companies', 'list'], queryFn: () => listCompanies() })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CompanyInput) => createCompany(input),
    onSuccess: () => {
      message.success('Company added')
      void queryClient.invalidateQueries({ queryKey: ['placement-companies'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add company'))
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      message.success('Company deleted')
      void queryClient.invalidateQueries({ queryKey: ['placement-companies'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete company'))
    },
  })
}

// ---- Job openings ----

export function useJobOpeningsQuery(params: ListJobOpeningsParams) {
  return useQuery({
    queryKey: ['job-openings', 'list', params],
    queryFn: () => listJobOpenings(params),
    placeholderData: (previous) => previous,
  })
}

export function useJobOpeningQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['job-openings', 'detail', id],
    queryFn: () => getJobOpening(id!),
    enabled: !!id,
  })
}

export function useCreateJobOpening() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: JobOpeningInput) => createJobOpening(input),
    onSuccess: () => {
      message.success('Job opening added')
      void queryClient.invalidateQueries({ queryKey: ['job-openings'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add job opening'))
    },
  })
}

export function useDeleteJobOpening() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteJobOpening(id),
    onSuccess: () => {
      message.success('Job opening deleted')
      void queryClient.invalidateQueries({ queryKey: ['job-openings'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete job opening'))
    },
  })
}

// ---- Applications ----

export function useApplicationsQuery(params: ListApplicationsParams) {
  return useQuery({
    queryKey: ['placement-applications', 'list', params],
    queryFn: () => listApplications(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for resolving names in the applications table — small, unpaginated-in-practice lookup. */
export function useAllStudentsForPlacements() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateApplicationStatusInput }) =>
      updateApplicationStatus(id, input),
    onSuccess: () => {
      message.success('Application status updated')
      void queryClient.invalidateQueries({ queryKey: ['placement-applications'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update application status'))
    },
  })
}
