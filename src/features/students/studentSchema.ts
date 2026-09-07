import { z } from 'zod'

const phoneRegex = /^\+?[0-9 ]{7,15}$/

export const studentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number'),
  rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
  departmentId: z.string().min(1, 'Department is required'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  status: z.enum(['active', 'inactive', 'alumni']),
  guardianName: z.string().trim().max(120).optional(),
  guardianPhone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number').optional().or(z.literal('')),
  address: z.string().trim().max(300).optional(),
})

export type StudentFormValues = z.infer<typeof studentSchema>
