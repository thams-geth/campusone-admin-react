import { z } from 'zod'

export const academicYearSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(20),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isCurrent: z.boolean(),
    status: z.enum(['ACTIVE', 'CLOSED']),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type AcademicYearFormValues = z.infer<typeof academicYearSchema>
