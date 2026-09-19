import { z } from 'zod'

/** Mirrors AdmissionApplicationInput in admissionsApi.ts — wire format, no lowercase translation. */
const phoneRegex = /^\+?[0-9 ]{7,15}$/

export const admissionApplicationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  programId: z.string().min(1, 'Program is required'),
})

export type AdmissionApplicationFormValues = z.infer<typeof admissionApplicationSchema>

/** Mirrors EnrollApplicationInput — only reachable once an application is ACCEPTED. */
export const enrollApplicationSchema = z.object({
  rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
  sectionId: z.string().optional(),
})

export type EnrollApplicationFormValues = z.infer<typeof enrollApplicationSchema>
