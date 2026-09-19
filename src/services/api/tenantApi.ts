import type { Tenant, TenantModule } from '@/types/tenant'
import { http } from '@/services/api/httpClient'

interface InstitutionResponse {
  id: string
  name: string
  slug: string
  primaryColor: string | null
  createdAt: string
}

export async function getCurrentTenant(): Promise<Tenant> {
  const tenant = await http.get<InstitutionResponse>('/institution')
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    primaryColor: tenant.primaryColor ?? undefined,
    createdAt: tenant.createdAt,
  }
}

/**
 * The API doesn't expose a tenant-facing "list my enabled modules"
 * endpoint yet (see campusone-api's README: TenantModule rows are set
 * directly for now, no admin endpoint). Returning an empty list is
 * honest about that gap — CORE is always on regardless (see
 * AuthProvider's hasModule) — rather than fabricating entitlement data.
 * Replace this once that endpoint exists.
 */
export async function getTenantModules(): Promise<TenantModule[]> {
  return []
}
