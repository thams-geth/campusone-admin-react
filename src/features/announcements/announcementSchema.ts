import { z } from 'zod'

/** Backend enum values, uppercase — announcementsApi.ts mirrors the wire format exactly, no lowercase translation. */
const AUDIENCE_TARGET_FIELD = {
  DEPARTMENT: 'departmentId',
  PROGRAM: 'programId',
  BATCH: 'batchId',
  SECTION: 'sectionId',
} as const

export const announcementSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    content: z.string().trim().min(1, 'Content is required'),
    audience: z.enum(['COLLEGE', 'DEPARTMENT', 'PROGRAM', 'BATCH', 'SECTION'], { message: 'Audience is required' }),
    departmentId: z.string().optional(),
    programId: z.string().optional(),
    batchId: z.string().optional(),
    sectionId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    publishAt: z.string().optional(),
    expiryAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const field = AUDIENCE_TARGET_FIELD[data.audience as keyof typeof AUDIENCE_TARGET_FIELD]
    if (field && !data[field]) {
      ctx.addIssue({ code: 'custom', path: [field], message: 'Required for this audience' })
    }
  })

export type AnnouncementFormValues = z.infer<typeof announcementSchema>
