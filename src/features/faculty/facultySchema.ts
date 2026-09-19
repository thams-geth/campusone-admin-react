import { z } from 'zod'

/** Shared by both create and edit — email/password are layered on for create only, see below. */
const baseFacultyShape = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  employeeCode: z.string().trim().min(1, 'Employee code is required').max(30),
  departmentId: z.string().min(1, 'Department is required'),
  designation: z.string().trim().min(1, 'Designation is required').max(80),
  qualification: z.string().trim().max(120).optional(),
  experienceYears: z
    .number({ message: 'Experience is required' })
    .int('Enter a whole number of years')
    .min(0, 'Experience cannot be negative')
    .max(60, 'Enter a realistic number of years'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
}

/**
 * One shared shape for both the create and edit forms — `email`/`password`
 * are always present in form state (so react-hook-form has stable fields to
 * register/reset), but are only required, and only rendered, when creating
 * (see FacultyFormPage.tsx). Creating a faculty member also provisions their
 * login account (see FacultyCreateInput in facultyApi.ts); editing never
 * sends these — FacultyUpdateInput has no email/password, per the API's own
 * doc comment ("email/password changes aren't supported through this
 * endpoint yet"). `buildFacultySchema(isCreate)` toggles which validation
 * applies; the caller picks the right one via `zodResolver`.
 */
export function buildFacultySchema(isCreate: boolean) {
  return z
    .object({
      ...baseFacultyShape,
      email: z.string().trim().optional(),
      password: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!isCreate) return
      if (!data.email || !data.email.trim()) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'Email is required' })
      } else if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'Enter a valid email address' })
      }
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({ code: 'custom', path: ['password'], message: 'Password must be at least 8 characters' })
      }
    })
}

export type FacultyFormValues = z.infer<ReturnType<typeof buildFacultySchema>>
