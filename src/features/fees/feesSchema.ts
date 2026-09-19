import { z } from 'zod'

/**
 * Mirrors feesApi.ts's *Input shapes exactly — enum values stay uppercase,
 * no lowercase translation (see feesApi.ts's own doc comment). Amount
 * fields use plain z.number() (not z.coerce.number()): antd's InputNumber
 * already hands the Controller a `number | null`, so string coercion isn't
 * needed, and z.coerce's differing input/output types break the
 * zodResolver/useForm generic inference — same reasoning as leaveSchema.ts.
 */

export const feeInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeStructureId: z.string().optional(),
  category: z.enum(['TUITION', 'HOSTEL', 'TRANSPORT', 'EXAM', 'LIBRARY', 'LAB', 'OTHER'], {
    message: 'Category is required',
  }),
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
})

export type FeeInvoiceFormValues = z.infer<typeof feeInvoiceSchema>

export const feeStructureSchema = z.object({
  programId: z.string().min(1, 'Program is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  category: z.enum(['TUITION', 'HOSTEL', 'TRANSPORT', 'EXAM', 'LIBRARY', 'LAB', 'OTHER'], {
    message: 'Category is required',
  }),
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
})

export type FeeStructureFormValues = z.infer<typeof feeStructureSchema>

export const paymentSchema = z.object({
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'OTHER'], { message: 'Method is required' }),
  transactionRef: z.string().optional(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>

export const adjustmentSchema = z.object({
  type: z.enum(['DISCOUNT', 'SCHOLARSHIP', 'FINE'], { message: 'Type is required' }),
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  reason: z.string().trim().min(1, 'Reason is required'),
})

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

export const refundSchema = z.object({
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  reason: z.string().trim().min(1, 'Reason is required'),
})

export type RefundFormValues = z.infer<typeof refundSchema>
