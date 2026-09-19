import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import type { Student } from '@/types/student'
import {
  approveAttendanceCorrection,
  createAttendanceSession,
  getAttendanceSession,
  listAttendanceCorrections,
  listAttendanceSessions,
  lockAttendanceSession,
  markAttendanceRecords,
  rejectAttendanceCorrection,
  requestAttendanceCorrection,
  submitAttendanceSession,
  type AttendanceSession,
  type CreateAttendanceSessionInput,
  type ListAttendanceCorrectionsParams,
  type ListAttendanceSessionsParams,
  type MarkAttendanceRecordsInput,
  type RequestAttendanceCorrectionInput,
} from '@/services/api/attendanceApi'
import { listSections } from '@/services/api/sectionsApi'
import { listSubjects } from '@/services/api/subjectsApi'
import { listStudents } from '@/services/api/studentsApi'

export function useAttendanceSessionsQuery(params: ListAttendanceSessionsParams) {
  return useQuery({
    queryKey: ['attendance', 'sessions', 'list', params],
    queryFn: () => listAttendanceSessions(params),
    placeholderData: (previous) => previous,
  })
}

export function useAttendanceSessionQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['attendance', 'sessions', 'detail', id],
    queryFn: () => getAttendanceSession(id!),
    enabled: !!id,
  })
}

/** Section/subject pickers for the create-session form and list filters — small, unpaginated-in-practice lookups (page 1 of 100). */
export function useAllSectionsForAttendance() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useAllSubjectsForAttendance() {
  return useQuery({ queryKey: ['subjects', 'all'], queryFn: () => listSubjects({ page: 1, pageSize: 100 }) })
}

const ROSTER_PAGE_CAP = 10

/**
 * Fallback roster lookup for a session that was created with an empty
 * section (so it has no pre-populated records — see the "who's in this
 * session" note in AttendanceSessionPage.tsx). studentsApi/listStudents
 * has no sectionId filter server-side (only departmentId/status — see
 * the backend's student.schema.ts), so this paginates through students
 * tenant-wide (capped at 10 pages / 1000 students) and filters
 * client-side by sectionId. Fine for a demo tenant; a real deployment
 * would want a dedicated `/students?sectionId=` filter added server-side.
 */
export function useSectionRoster(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['attendance', 'roster', sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      const students: Student[] = []
      let page = 1
      for (;;) {
        const result = await listStudents({ page, pageSize: 100 })
        students.push(...result.data)
        if (page >= result.meta.totalPages || page >= ROSTER_PAGE_CAP) break
        page += 1
      }
      return students.filter((student) => student.sectionId === sectionId)
    },
  })
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateAttendanceSessionInput) => createAttendanceSession(input),
    onSuccess: () => {
      message.success('Attendance session created')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create attendance session'))
    },
  })
}

export function useMarkAttendanceRecords() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: MarkAttendanceRecordsInput }) =>
      markAttendanceRecords(sessionId, input),
    onSuccess: (_, variables) => {
      message.success('Attendance saved')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions', 'detail', variables.sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions', 'list'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to save attendance'))
    },
  })
}

export function useSubmitAttendanceSession() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => submitAttendanceSession(id),
    onSuccess: () => {
      message.success('Session submitted')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to submit session'))
    },
  })
}

export function useLockAttendanceSession() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => lockAttendanceSession(id),
    onSuccess: () => {
      message.success('Session locked')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to lock session'))
    },
  })
}

export function useRequestAttendanceCorrection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ recordId, input }: { recordId: string; input: RequestAttendanceCorrectionInput }) =>
      requestAttendanceCorrection(recordId, input),
    onSuccess: () => {
      message.success('Correction requested')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to request correction'))
    },
  })
}

export function useAttendanceCorrectionsQuery(params: ListAttendanceCorrectionsParams) {
  return useQuery({
    queryKey: ['attendance', 'corrections', 'list', params],
    queryFn: () => listAttendanceCorrections(params),
    placeholderData: (previous) => previous,
  })
}

export function useApproveAttendanceCorrection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => approveAttendanceCorrection(id),
    onSuccess: () => {
      message.success('Correction approved')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to approve correction'))
    },
  })
}

export function useRejectAttendanceCorrection() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => rejectAttendanceCorrection(id),
    onSuccess: () => {
      message.success('Correction rejected')
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'corrections'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to reject correction'))
    },
  })
}

export type { AttendanceSession }
