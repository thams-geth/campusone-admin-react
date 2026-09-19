import { z } from 'zod'

export const vehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1, 'Registration number is required').max(30),
  driverName: z.string().trim().min(1, 'Driver name is required').max(200),
  driverPhone: z.string().trim().min(1, 'Driver phone is required').max(20),
  // Plain z.number() (not z.coerce.number()): antd's InputNumber already
  // hands the Controller a `number | null`, so no string coercion is
  // needed — see leaveSchema.ts's defaultDaysPerYear for the same reasoning.
  capacity: z.number({ message: 'Must be a number' }).min(1, 'Must be at least 1').max(100),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>

export const routeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  vehicleId: z.string().optional(),
})

export type RouteFormValues = z.infer<typeof routeSchema>

export const stopSchema = z.object({
  name: z.string().trim().min(1, 'Stop name is required').max(200),
  sequence: z.number({ message: 'Must be a number' }).min(1, 'Must be at least 1').max(200),
})

export type StopFormValues = z.infer<typeof stopSchema>

export const transportAllocationSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  routeId: z.string().min(1, 'Route is required'),
  stopId: z.string().min(1, 'Stop is required'),
})

export type TransportAllocationFormValues = z.infer<typeof transportAllocationSchema>
