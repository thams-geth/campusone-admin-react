import { z } from 'zod'

export const apiKeySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
})

export type ApiKeyFormValues = z.infer<typeof apiKeySchema>

/**
 * The backend just stores freeform strings for eventTypes — this is a
 * reasonable fixed set for the UI's multi-select, but the field accepts
 * any string typed in (antd Select `mode="tags"`), so it isn't a closed enum.
 */
export const WEBHOOK_EVENT_TYPE_OPTIONS = [
  'student.created',
  'student.updated',
  'attendance.locked',
  'fee.invoice.created',
  'fee.paid',
  'admission.enrolled',
  'exam.result.published',
  'announcement.published',
] as const

export const webhookEndpointSchema = z.object({
  url: z.string().trim().min(1, 'URL is required').url('Must be a valid URL'),
  eventTypes: z.array(z.string().trim().min(1)).min(1, 'At least one event type is required'),
  enabled: z.boolean(),
})

export type WebhookEndpointFormValues = z.infer<typeof webhookEndpointSchema>

/** JSON textarea for a provider's settings — validated as parseable JSON before submit. */
export const integrationSettingsSchema = z.object({
  enabled: z.boolean(),
  settingsText: z.string().trim().refine(
    (value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    },
    { message: 'Must be valid JSON' },
  ),
})

export type IntegrationSettingsFormValues = z.infer<typeof integrationSettingsSchema>
