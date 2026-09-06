import type { Tenant, TenantModule } from '@/types/tenant'
import { networkDelay } from '@/services/mock/latency'
import { mockTenant, mockTenantModules } from '@/services/mock/db/tenant'

export async function getCurrentTenant(): Promise<Tenant> {
  await networkDelay(150)
  return structuredClone(mockTenant)
}

export async function getTenantModules(): Promise<TenantModule[]> {
  await networkDelay(150)
  return structuredClone(mockTenantModules)
}
