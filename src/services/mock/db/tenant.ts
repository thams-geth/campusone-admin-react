import type { Tenant, TenantModule } from '@/types/tenant'

export const TENANT_ID = 'tenant-aurora'

export const mockTenant: Tenant = {
  id: TENANT_ID,
  name: 'Aurora College of Engineering',
  slug: 'aurora',
  primaryColor: '#4338ca',
  createdAt: '2022-06-01T00:00:00.000Z',
}

/**
 * Core is always on for every tenant. Everything else reflects what
 * this particular tenant has "installed" — matches the tenant_modules
 * model in CLAUDE.md. V1 only builds against `core`; the rest are seeded
 * here so the entitlement plumbing has real data to check against.
 */
export const mockTenantModules: TenantModule[] = [
  { moduleId: 'core', enabled: true, planTier: 'standard' },
  { moduleId: 'academics', enabled: true, planTier: 'standard' },
  { moduleId: 'admissions', enabled: false, planTier: 'basic' },
  { moduleId: 'finance', enabled: false, planTier: 'basic' },
  { moduleId: 'examination', enabled: false, planTier: 'basic' },
  { moduleId: 'hr-payroll', enabled: false, planTier: 'basic' },
  { moduleId: 'library', enabled: false, planTier: 'basic' },
  { moduleId: 'hostel-transport', enabled: false, planTier: 'basic' },
  { moduleId: 'placement-alumni', enabled: false, planTier: 'basic' },
  { moduleId: 'communication', enabled: true, planTier: 'standard' },
  { moduleId: 'compliance-reporting', enabled: false, planTier: 'enterprise' },
  { moduleId: 'inventory-procurement', enabled: false, planTier: 'enterprise' },
]
