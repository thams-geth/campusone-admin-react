import { z } from 'zod'

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(12)
    .regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
    .transform((value) => value.toUpperCase()),
  headOfDepartment: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(['active', 'inactive']),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>
