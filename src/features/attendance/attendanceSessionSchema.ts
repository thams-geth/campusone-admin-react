import { z } from 'zod'

/** Create-session form. Faculty is deliberately not collected — the backend resolves the caller's own Faculty profile when omitted (see attendanceApi.ts's CreateAttendanceSessionInput). */
export const attendanceSessionSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  date: z.string().min(1, 'Date is required'),
})

export type AttendanceSessionFormValues = z.infer<typeof attendanceSessionSchema>
