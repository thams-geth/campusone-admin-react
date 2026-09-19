import { z } from 'zod'

export const certificateRequestSchema = z.object({
  certificateTypeId: z.string().min(1, 'Certificate type is required'),
  studentId: z.string().min(1, 'Student is required'),
})

export type CertificateRequestFormValues = z.infer<typeof certificateRequestSchema>
