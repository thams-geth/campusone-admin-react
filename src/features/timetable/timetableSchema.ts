import { z } from 'zod'

/** Backend enum values, uppercase — timetableApi.ts mirrors the wire format exactly, no lowercase translation. */
export const WEEKDAY_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
] as const

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export const timetableEntrySchema = z
  .object({
    sectionId: z.string().min(1, 'Section is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    facultyId: z.string().min(1, 'Faculty is required'),
    roomId: z.string().min(1, 'Room is required'),
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], {
      message: 'Day of week is required',
    }),
    startTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 09:00'),
    endTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 10:00'),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
    }
  })

export type TimetableEntryFormValues = z.infer<typeof timetableEntrySchema>
