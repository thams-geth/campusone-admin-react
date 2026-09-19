import { http } from '@/services/api/httpClient'

/** Normal list/get shape — never carries the raw secret. */
export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  createdBy: { id: string; name: string; email: string }
}

/**
 * Response from creation only — carries the raw `key`, shown exactly once.
 * Every other read of an API key (list) returns `ApiKey`, never this.
 */
export interface CreatedApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
  key: string
}

export interface CreateApiKeyInput {
  name: string
}

export async function listApiKeys(): Promise<ApiKey[]> {
  return http.get<ApiKey[]>('/api-keys')
}

export async function createApiKey(input: CreateApiKeyInput): Promise<CreatedApiKey> {
  return http.post<CreatedApiKey>('/api-keys', input)
}

export async function revokeApiKey(id: string): Promise<void> {
  await http.delete<void>(`/api-keys/${id}`)
}
