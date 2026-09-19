import { z } from 'zod'

/** Backend enum values, uppercase — subjectsApi.ts mirrors the wire format exactly, no lowercase translation. */
export const SUBJECT_TYPE_OPTIONS = [
  { value: 'CORE', label: 'Core' },
  { value: 'ELECTIVE', label: 'Elective' },
  { value: 'LAB', label: 'Lab' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'PRACTICAL', label: 'Practical' },
] as const

export const SUBJECT_TYPE_COLOR: Record<string, string> = {
  CORE: 'blue',
  ELECTIVE: 'purple',
  LAB: 'green',
  PROJECT: 'gold',
  SEMINAR: 'cyan',
  PRACTICAL: 'magenta',
}

export const subjectSchema = z.object({
  programId: z.string().min(1, 'Program is required'),
  semesterNumber: z.number({ message: 'Semester is required' }).int().min(1, 'Semester is required').max(12),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  credits: z.number({ message: 'Credits is required' }).min(0, 'Credits cannot be negative').max(30),
  type: z.enum(['CORE', 'ELECTIVE', 'LAB', 'PROJECT', 'SEMINAR', 'PRACTICAL'], { message: 'Type is required' }),
  facultyId: z.string().optional(),
})

export type SubjectFormValues = z.infer<typeof subjectSchema>
