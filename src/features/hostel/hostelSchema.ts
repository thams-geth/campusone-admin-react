import { z } from 'zod'

export const hostelSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
})

export type HostelFormValues = z.infer<typeof hostelSchema>

export const hostelRoomSchema = z.object({
  hostelId: z.string().min(1, 'Hostel is required'),
  roomNumber: z.string().trim().min(1, 'Room number is required').max(50),
  // Plain z.number() (not z.coerce.number()): antd's InputNumber already
  // hands the Controller a `number | null`, so no string coercion is
  // needed — see leaveSchema.ts's defaultDaysPerYear for the same reasoning.
  capacity: z.number({ message: 'Must be a number' }).min(1, 'Must be at least 1').max(20),
})

export type HostelRoomFormValues = z.infer<typeof hostelRoomSchema>

export const hostelAllocationSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  hostelRoomId: z.string().min(1, 'Room is required'),
  startDate: z.string().min(1, 'Start date is required'),
})

export type HostelAllocationFormValues = z.infer<typeof hostelAllocationSchema>
