import { z } from 'zod'

/**
 * Mirrors billingApi.ts's CreateInvoiceInput exactly — amount is optional
 * (the backend defaults it to the plan's monthly price when omitted), plain
 * z.number() rather than z.coerce.number() since antd's InputNumber already
 * hands the Controller a `number | null` — same reasoning as feesSchema.ts.
 */
export const createInvoiceSchema = z.object({
  amount: z.number({ message: 'Amount must be a number' }).positive('Amount must be greater than 0').optional(),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
})

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>
