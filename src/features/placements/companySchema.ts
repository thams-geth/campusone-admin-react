import { z } from 'zod'

/** Mirrors CompanyInput in placementsApi.ts. */
export const companySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  website: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
})

export type CompanyFormValues = z.infer<typeof companySchema>
