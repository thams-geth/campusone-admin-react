import { z } from 'zod'

/** Mirrors BatchInput in batchesApi.ts. */
export const batchSchema = z
  .object({
    programId: z.string().min(1, 'Program is required'),
    academicYearId: z.string().min(1, 'Academic year is required'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    // Plain z.number() (not z.coerce.number()): antd's InputNumber already
    // hands the Controller a `number | null`, so no string coercion is
    // needed — see leaveSchema.ts's defaultDaysPerYear for the same reasoning.
    startYear: z.number({ message: 'Start year is required' }).int().min(2000).max(2100),
    endYear: z.number({ message: 'End year is required' }).int().min(2000).max(2100),
    status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED']),
  })
  .refine((data) => data.endYear >= data.startYear, {
    message: 'End year must be on or after start year',
    path: ['endYear'],
  })

export type BatchFormValues = z.infer<typeof batchSchema>
