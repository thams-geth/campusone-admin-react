import type { AdmissionStatus } from '@/services/api/admissionsApi'

/** Tag color per lifecycle stage — shared between the list and details pages. */
export const STATUS_COLOR: Record<AdmissionStatus, string> = {
  APPLIED: 'blue',
  DOCUMENT_VERIFICATION: 'gold',
  SHORTLISTED: 'cyan',
  APPROVED: 'geekblue',
  OFFERED: 'purple',
  ACCEPTED: 'lime',
  ENROLLED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'default',
}
