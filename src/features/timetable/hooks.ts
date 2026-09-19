import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createPeriodSlot,
  createTimetableEntry,
  deletePeriodSlot,
  deleteTimetableEntry,
  listPeriodSlots,
  listTimetableEntries,
  updatePeriodSlot,
  updateTimetableEntry,
  type ListTimetableParams,
  type PeriodSlotInput,
  type TimetableEntryInput,
} from '@/services/api/timetableApi'
import { listSections } from '@/services/api/sectionsApi'
import { listSubjects } from '@/services/api/subjectsApi'
import { listFaculty } from '@/services/api/facultyApi'
import { listRooms } from '@/services/api/roomsApi'

export function useTimetableEntriesQuery(params: ListTimetableParams) {
  return useQuery({
    queryKey: ['timetable', 'list', params],
    queryFn: () => listTimetableEntries(params),
    placeholderData: (previous) => previous,
  })
}

/** Filter/select pickers — small, unpaginated-in-practice lookups (page 1 of 100). */
export function useAllSectionsForTimetable() {
  return useQuery({ queryKey: ['sections', 'all'], queryFn: () => listSections({ page: 1, pageSize: 100 }) })
}

export function useAllSubjectsForTimetable() {
  return useQuery({ queryKey: ['subjects', 'all'], queryFn: () => listSubjects({ page: 1, pageSize: 100 }) })
}

export function useAllFacultyForTimetable() {
  return useQuery({ queryKey: ['faculty', 'all'], queryFn: () => listFaculty({ page: 1, pageSize: 100 }) })
}

export function useAllRoomsForTimetable() {
  return useQuery({ queryKey: ['rooms', 'all'], queryFn: () => listRooms({ page: 1, pageSize: 100 }) })
}

export function useCreateTimetableEntry() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: TimetableEntryInput) => createTimetableEntry(input),
    onSuccess: () => {
      message.success('Timetable entry added')
      void queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add timetable entry'))
    },
  })
}

export function useUpdateTimetableEntry() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TimetableEntryInput }) => updateTimetableEntry(id, input),
    onSuccess: () => {
      message.success('Timetable entry updated')
      void queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update timetable entry'))
    },
  })
}

export function useDeleteTimetableEntry() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteTimetableEntry(id),
    onSuccess: () => {
      message.success('Timetable entry removed')
      void queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove timetable entry'))
    },
  })
}

/** The institution's shared daily bell schedule — a separate resource from timetable entries, own query key. */
export function usePeriodSlotsQuery() {
  return useQuery({
    queryKey: ['periodSlots'],
    queryFn: () => listPeriodSlots(),
  })
}

export function useCreatePeriodSlot() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: PeriodSlotInput) => createPeriodSlot(input),
    onSuccess: () => {
      message.success('Period added')
      void queryClient.invalidateQueries({ queryKey: ['periodSlots'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add period'))
    },
  })
}

export function useUpdatePeriodSlot() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PeriodSlotInput }) => updatePeriodSlot(id, input),
    onSuccess: () => {
      message.success('Period updated')
      void queryClient.invalidateQueries({ queryKey: ['periodSlots'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update period'))
    },
  })
}

export function useDeletePeriodSlot() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deletePeriodSlot(id),
    onSuccess: () => {
      message.success('Period removed')
      void queryClient.invalidateQueries({ queryKey: ['periodSlots'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove period'))
    },
  })
}
