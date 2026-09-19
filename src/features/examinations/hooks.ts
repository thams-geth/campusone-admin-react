import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createExam,
  createExamSchedule,
  deleteExam,
  deleteExamSchedule,
  editMarks,
  enterMarks,
  getCgpa,
  getExam,
  getSemesterResult,
  listExamSchedules,
  listExams,
  listMarksForSchedule,
  publishMarks,
  reviseMarks,
  submitMarks,
  updateExam,
  updateExamSchedule,
  verifyMarks,
  type EditMarksInput,
  type EnterMarksInput,
  type Exam,
  type ExamInput,
  type ExamScheduleInput,
  type ListExamsParams,
  type ReviseMarksInput,
} from '@/services/api/examinationsApi'
import { listAcademicYears } from '@/services/api/academicYearsApi'
import { listSubjects } from '@/services/api/subjectsApi'
import { listRooms } from '@/services/api/roomsApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Lookups for form selects — small, unpaginated-in-practice (page 1 of 100), same pattern as announcements/leave. ----

export function useAllAcademicYears() {
  return useQuery({ queryKey: ['academic-years', 'all'], queryFn: () => listAcademicYears({ page: 1, pageSize: 100 }) })
}

export function useAllSubjects() {
  return useQuery({ queryKey: ['subjects', 'all'], queryFn: () => listSubjects({ page: 1, pageSize: 100 }) })
}

export function useAllRooms() {
  return useQuery({ queryKey: ['rooms', 'all'], queryFn: () => listRooms({ page: 1, pageSize: 100 }) })
}

/**
 * Student picker for staff adding a roster row one at a time. There's no
 * backend endpoint that resolves "which students take this exam schedule"
 * (ExamSchedule only carries subjectId/roomId, not a sectionId, and
 * listStudents has no subject/program filter) — see ExamScheduleMarksPage's
 * comment for the full explanation of this gap.
 */
export function useAllStudentsForMarks() {
  return useQuery({ queryKey: ['students', 'all'], queryFn: () => listStudents({ page: 1, pageSize: 100 }) })
}

// ---- Exams ----

export function useExamsQuery(params: ListExamsParams) {
  return useQuery({
    queryKey: ['exams', 'list', params],
    queryFn: () => listExams(params),
    placeholderData: (previous) => previous,
  })
}

export function useExamQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['exams', 'detail', id],
    queryFn: () => getExam(id as string),
    enabled: !!id,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: ExamInput) => createExam(input),
    onSuccess: () => {
      message.success('Exam created')
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create exam'))
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExamInput }) => updateExam(id, input),
    onSuccess: () => {
      message.success('Exam updated')
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update exam'))
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteExam(id),
    onSuccess: () => {
      message.success('Exam deleted')
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete exam'))
    },
  })
}

// ---- Exam schedules ----

export function useExamSchedulesQuery(examId: string | undefined) {
  return useQuery({
    queryKey: ['exam-schedules', 'list', examId],
    queryFn: () => listExamSchedules(examId as string),
    enabled: !!examId,
  })
}

export function useCreateExamSchedule() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: ExamScheduleInput }) => createExamSchedule(examId, input),
    onSuccess: (_data, variables) => {
      message.success('Schedule added')
      void queryClient.invalidateQueries({ queryKey: ['exam-schedules', 'list', variables.examId] })
      void queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add schedule'))
    },
  })
}

export function useUpdateExamSchedule() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExamScheduleInput; examId: string }) => updateExamSchedule(id, input),
    onSuccess: (_data, variables) => {
      message.success('Schedule updated')
      void queryClient.invalidateQueries({ queryKey: ['exam-schedules', 'list', variables.examId] })
      void queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update schedule'))
    },
  })
}

export function useDeleteExamSchedule() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id }: { id: string; examId: string }) => deleteExamSchedule(id),
    onSuccess: (_data, variables) => {
      message.success('Schedule removed')
      void queryClient.invalidateQueries({ queryKey: ['exam-schedules', 'list', variables.examId] })
      void queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove schedule'))
    },
  })
}

// ---- Marks ----

export function useMarksForScheduleQuery(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ['marks', 'schedule', scheduleId],
    queryFn: () => listMarksForSchedule(scheduleId as string),
    enabled: !!scheduleId,
  })
}

export function useEnterMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ scheduleId, input }: { scheduleId: string; input: EnterMarksInput }) => enterMarks(scheduleId, input),
    onSuccess: (_data, variables) => {
      message.success('Marks saved')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', variables.scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to save marks'))
    },
  })
}

export function useEditMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditMarksInput; scheduleId: string }) => editMarks(id, input),
    onSuccess: (_data, variables) => {
      message.success('Marks updated')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', variables.scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update marks'))
    },
  })
}

export function useReviseMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviseMarksInput; scheduleId: string }) => reviseMarks(id, input),
    onSuccess: (_data, variables) => {
      message.success('Marks revised')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', variables.scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to revise marks'))
    },
  })
}

export function useSubmitMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (scheduleId: string) => submitMarks(scheduleId),
    onSuccess: (_data, scheduleId) => {
      message.success('Marks submitted')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to submit marks'))
    },
  })
}

export function useVerifyMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (scheduleId: string) => verifyMarks(scheduleId),
    onSuccess: (_data, scheduleId) => {
      message.success('Marks verified')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to verify marks'))
    },
  })
}

export function usePublishMarks() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (scheduleId: string) => publishMarks(scheduleId),
    onSuccess: (_data, scheduleId) => {
      message.success('Marks published')
      void queryClient.invalidateQueries({ queryKey: ['marks', 'schedule', scheduleId] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to publish marks'))
    },
  })
}

// ---- Results (SGPA/CGPA) — computed on read from PUBLISHED marks only. Fetched on demand, not auto-run. ----

export function useSemesterResultQuery(semesterNumber: number | undefined, studentId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'semester', semesterNumber, studentId],
    queryFn: () => getSemesterResult(semesterNumber as number, studentId),
    enabled: false,
  })
}

export function useCgpaQuery(studentId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'cgpa', studentId],
    queryFn: () => getCgpa(studentId),
    enabled: false,
  })
}

export type { Exam }
