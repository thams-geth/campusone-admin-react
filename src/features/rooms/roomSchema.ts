import { z } from 'zod'

export const roomSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
    .transform((value) => value.toUpperCase()),
  // Plain z.number() (not z.coerce.number()): antd's InputNumber already
  // hands the Controller a `number | null`, so no string coercion is
  // needed — nullable so a cleared InputNumber round-trips to `undefined`
  // on submit, same pattern as sectionSchema's capacity.
  capacity: z.number().int().min(1).max(2000).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type RoomFormValues = z.infer<typeof roomSchema>
