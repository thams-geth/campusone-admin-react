import { http } from '@/services/api/httpClient'

/**
 * The Tenant *is* the institution (campusone-api's institution.service.ts
 * doc comment) — there's no separate settings table, just the
 * non-identity fields on Tenant. `campusone-admin/src/services/api/tenantApi.ts`
 * already calls `GET /institution` for a narrower Tenant-shaped read;
 * this file is the full institution settings CRUD surface (GET + PUT).
 */
export interface Institution {
  id: string
  name: string
  slug: string
  primaryColor: string | null
  createdAt: string
  updatedAt: string
}

export interface InstitutionUpdateInput {
  name: string
  /** 6-digit hex color, e.g. "#1677FF". Empty string clears it. */
  primaryColor?: string
}

export async function getInstitution(): Promise<Institution> {
  return http.get<Institution>('/institution')
}

export async function updateInstitution(input: InstitutionUpdateInput): Promise<Institution> {
  return http.put<Institution>('/institution', input)
}
