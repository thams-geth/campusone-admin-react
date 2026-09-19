import { http } from '@/services/api/httpClient'

/**
 * Config-only — enabling one flips a flag and stores JSON settings; no
 * code path in the backend ever calls out to any of these providers.
 */
export type IntegrationProvider =
  | 'PAYMENT_GATEWAY'
  | 'EMAIL'
  | 'SMS'
  | 'FIREBASE'
  | 'GOOGLE_WORKSPACE'
  | 'MICROSOFT_365'
  | 'BIOMETRIC_ATTENDANCE'
  | 'ACCOUNTING_SOFTWARE'
  | 'LMS'
  | 'LIBRARY_SYSTEM'

export interface IntegrationConfig {
  id: string
  tenantId: string
  provider: IntegrationProvider
  enabled: boolean
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface UpsertIntegrationConfigInput {
  enabled: boolean
  settings?: Record<string, unknown>
}

export async function listIntegrations(): Promise<IntegrationConfig[]> {
  return http.get<IntegrationConfig[]>('/integrations')
}

export async function upsertIntegration(
  provider: IntegrationProvider,
  input: UpsertIntegrationConfigInput,
): Promise<IntegrationConfig> {
  return http.put<IntegrationConfig>(`/integrations/${provider}`, input)
}
