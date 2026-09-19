import { z } from 'zod'

export const documentSchema = z.object({
  ownerType: z.enum(['STUDENT', 'FACULTY', 'APPLICANT'], { message: 'Owner type is required' }),
  ownerId: z.string().min(1, 'Owner is required'),
  type: z.enum(['BONAFIDE', 'TRANSFER_CERTIFICATE', 'CONDUCT_CERTIFICATE', 'MARK_SHEET', 'ID_PROOF', 'OTHER'], {
    message: 'Document type is required',
  }),
  fileUrl: z.string().trim().min(1, 'File URL is required'),
  expiryDate: z.string().optional(),
})

export type DocumentFormValues = z.infer<typeof documentSchema>
