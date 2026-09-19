import { z } from 'zod'

/**
 * Mirrors JobOpeningInput in placementsApi.ts. minCgpa/ctcOffered use plain
 * z.number() (not z.coerce.number()) — antd's InputNumber already hands the
 * Controller a `number | null`, and z.coerce's differing input/output types
 * break the zodResolver/useForm generic inference (see leaveSchema.ts).
 */
export const jobOpeningSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  minCgpa: z.number().min(0).max(10).nullable().optional(),
  ctcOffered: z.number().min(0).nullable().optional(),
  applicationDeadline: z.string().optional(),
})

export type JobOpeningFormValues = z.infer<typeof jobOpeningSchema>

/** Mirrors UpdateApplicationStatusInput. */
export const applicationStatusSchema = z.object({
  status: z.enum(['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'], { message: 'Status is required' }),
  notes: z.string().trim().max(1000).optional(),
  offeredCtc: z.number().min(0).nullable().optional(),
})

export type ApplicationStatusFormValues = z.infer<typeof applicationStatusSchema>
