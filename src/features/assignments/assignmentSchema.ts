import { z } from 'zod'

/** Mirrors AssignmentInput in assignmentsApi.ts — facultyId is deliberately not collected here (server resolves the caller's own Faculty profile when omitted). */
export const assignmentSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().optional(),
    subjectId: z.string().min(1, 'Subject is required'),
    sectionId: z.string().min(1, 'Section is required'),
    startDate: z.string().min(1, 'Start date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    maxMarks: z.number({ message: 'Max marks is required' }).positive('Max marks must be greater than 0'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate && new Date(data.dueDate) < new Date(data.startDate)) {
      ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date must be on or after the start date' })
    }
  })

export type AssignmentFormValues = z.infer<typeof assignmentSchema>
