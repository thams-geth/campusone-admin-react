import { z } from 'zod'

/** Mirrors SectionInput in sectionsApi.ts. */
export const sectionSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  // Plain z.number() (not z.coerce.number()): antd's InputNumber already
  // hands the Controller a `number | null`, so no string coercion is
  // needed — see leaveSchema.ts's defaultDaysPerYear for the same reasoning.
  currentSemester: z.number({ message: 'Semester is required' }).int().min(1, 'Must be at least 1').max(12),
  // Optional numeric field: nullable so a cleared InputNumber round-trips
  // to `undefined` on submit — same pattern as jobOpeningSchema's minCgpa.
  capacity: z.number().int().min(1).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type SectionFormValues = z.infer<typeof sectionSchema>
