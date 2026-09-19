import { z } from 'zod'

export const certificateTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  category: z.string().trim().max(100).optional(),
})

export type CertificateTypeFormValues = z.infer<typeof certificateTypeSchema>
