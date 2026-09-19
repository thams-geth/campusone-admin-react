import { z } from 'zod'

/** Backend enum values, uppercase — examinationsApi.ts mirrors the wire format exactly, no lowercase translation. */
export const EXAM_TYPE_OPTIONS = [
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'MIDTERM', label: 'Mid-term' },
  { value: 'FINAL', label: 'Final' },
  { value: 'SUPPLEMENTARY', label: 'Supplementary' },
] as const

export const examSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    examType: z.enum(['INTERNAL', 'MIDTERM', 'FINAL', 'SUPPLEMENTARY'], { message: 'Exam type is required' }),
    academicYearId: z.string().min(1, 'Academic year is required'),
    semesterNumber: z.number({ message: 'Semester is required' }).int().min(1, 'Semester is required').max(12),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date cannot be before start date' })
    }
  })

export type ExamFormValues = z.infer<typeof examSchema>

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export const examScheduleSchema = z
  .object({
    subjectId: z.string().min(1, 'Subject is required'),
    examDate: z.string().min(1, 'Exam date is required'),
    startTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 09:00'),
    endTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 11:00'),
    roomId: z.string().min(1, 'Room is required'),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
    }
  })

export type ExamScheduleFormValues = z.infer<typeof examScheduleSchema>

export const reviseMarksSchema = z.object({
  marksObtained: z.number({ message: 'Marks obtained is required' }).min(0, 'Marks cannot be negative'),
  reason: z.string().trim().min(3, 'A reason is required to revise published marks'),
})

export type ReviseMarksFormValues = z.infer<typeof reviseMarksSchema>
