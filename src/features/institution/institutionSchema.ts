import { z } from 'zod'

const hexColorPattern = /^#[0-9A-Fa-f]{6}$/

export const institutionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // Empty string clears primaryColor (per InstitutionUpdateInput's doc comment).
  primaryColor: z
    .string()
    .refine((value) => value === '' || hexColorPattern.test(value), 'Must be a hex color like #1677FF'),
})

export type InstitutionFormValues = z.infer<typeof institutionSchema>
