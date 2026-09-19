import type { PaginatedResponse, PaginationParams } from '@/types/common'
import { http } from '@/services/api/httpClient'

/** Wire format mirrors the backend's Weekday enum exactly — no lowercase translation. */
export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface TimetableEntry {
  id: string
  tenantId: string
  sectionId: string
  subjectId: string
  facultyId: string
  roomId: string
  dayOfWeek: Weekday
  /** 24h "HH:mm", e.g. "09:00" — a plain time-of-day, not tied to a date. */
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

export interface TimetableEntryInput {
  sectionId: string
  subjectId: string
  facultyId: string
  roomId: string
  dayOfWeek: Weekday
  startTime: string
  endTime: string
}

export interface ListTimetableParams extends PaginationParams {
  sectionId?: string
  facultyId?: string
  roomId?: string
  dayOfWeek?: Weekday
}

export async function listTimetableEntries(
  params: ListTimetableParams = {},
): Promise<PaginatedResponse<TimetableEntry>> {
  const { page, pageSize, sectionId, facultyId, roomId, dayOfWeek } = params
  return http.get<PaginatedResponse<TimetableEntry>>('/timetable', { page, pageSize, sectionId, facultyId, roomId, dayOfWeek })
}

export async function getTimetableEntry(id: string): Promise<TimetableEntry> {
  return http.get<TimetableEntry>(`/timetable/${id}`)
}

export async function createTimetableEntry(input: TimetableEntryInput): Promise<TimetableEntry> {
  return http.post<TimetableEntry>('/timetable', input)
}

export async function updateTimetableEntry(id: string, input: TimetableEntryInput): Promise<TimetableEntry> {
  return http.put<TimetableEntry>(`/timetable/${id}`, input)
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  await http.delete<void>(`/timetable/${id}`)
}

/** The institution's shared daily bell schedule — one flat tenant-wide list, not per-section. */
export type PeriodType = 'TEACHING' | 'BREAK' | 'LUNCH'

export interface PeriodSlot {
  id: string
  tenantId: string
  label: string
  type: PeriodType
  /** 24h "HH:mm" — chronological order (by startTime) IS display order, there's no separate sortOrder field. */
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

export interface PeriodSlotInput {
  label: string
  type: PeriodType
  startTime: string
  endTime: string
}

/** Plain array response, ordered by startTime asc — no pagination envelope, unlike the other list endpoints. */
export async function listPeriodSlots(): Promise<PeriodSlot[]> {
  return http.get<PeriodSlot[]>('/timetable/periods')
}

export async function createPeriodSlot(input: PeriodSlotInput): Promise<PeriodSlot> {
  return http.post<PeriodSlot>('/timetable/periods', input)
}

export async function updatePeriodSlot(id: string, input: PeriodSlotInput): Promise<PeriodSlot> {
  return http.put<PeriodSlot>(`/timetable/periods/${id}`, input)
}

export async function deletePeriodSlot(id: string): Promise<void> {
  await http.delete<void>(`/timetable/periods/${id}`)
}
