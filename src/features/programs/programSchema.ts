import { z } from 'zod'

/** Backend enum values, uppercase — programsApi.ts mirrors the wire format exactly, no lowercase translation. */
export const PROGRAM_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

export const programSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
    .transform((value) => value.toUpperCase()),
  durationYears: z.number({ message: 'Duration is required' }).int().min(1, 'Must be at least 1 year').max(10),
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status is required' }),
})

export type ProgramFormValues = z.infer<typeof programSchema>
