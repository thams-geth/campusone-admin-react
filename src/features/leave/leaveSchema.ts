import { z } from 'zod'

/**
 * Mirrors CreateLeaveRequestInput in leaveApi.ts — studentId is deliberately
 * optional at the schema level (server resolves the caller's own Student
 * profile when omitted); this admin app always shows a picker instead since
 * there's no logged-in student session here.
 */
export const leaveRequestSchema = z
  .object({
    studentId: z.string().min(1, 'Student is required'),
    leaveTypeId: z.string().min(1, 'Leave type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be on or after the start date' })
    }
  })

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  // Plain z.number() (not z.coerce.number()): antd's InputNumber already
  // hands the Controller a `number | null`, so no string coercion is
  // needed — and z.coerce's differing input/output types break the
  // zodResolver/useForm generic inference (Input becomes `unknown`).
  defaultDaysPerYear: z.number({ message: 'Must be a number' }).min(0, 'Must be 0 or more').max(365),
})

export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>
