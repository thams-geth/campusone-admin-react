import { z } from 'zod'

export const activitySchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  type: z.enum(['ACHIEVEMENT', 'EVENT', 'CLUB', 'SPORTS', 'COMPETITION', 'INTERNSHIP', 'OTHER'], {
    message: 'Type is required',
  }),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional(),
  date: z.string().min(1, 'Date is required'),
  certificateUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || /^https?:\/\/.+/.test(value), 'Must be a valid URL')
    .optional(),
})

export type ActivityFormValues = z.infer<typeof activitySchema>
