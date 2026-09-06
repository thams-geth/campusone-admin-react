export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
  primaryColor?: string
  createdAt: string
}

/**
 * Platform module catalog. Core modules are always on; the rest are
 * installed per tenant. Kept as a plain string union (not enum) so new
 * modules are additive and don't require a build-time enum migration.
 */
export type ModuleId =
  | 'core'
  | 'academics'
  | 'admissions'
  | 'finance'
  | 'examination'
  | 'hr-payroll'
  | 'library'
  | 'hostel-transport'
  | 'placement-alumni'
  | 'communication'
  | 'compliance-reporting'
  | 'inventory-procurement'

export type PlanTier = 'basic' | 'standard' | 'enterprise'

export interface TenantModule {
  moduleId: ModuleId
  enabled: boolean
  planTier: PlanTier
}
