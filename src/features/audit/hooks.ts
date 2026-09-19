import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type ListAuditLogsParams } from '@/services/api/auditApi'

const auditLogsKey = (params: ListAuditLogsParams) => ['audit-logs', 'list', params] as const

export function useAuditLogsQuery(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: auditLogsKey(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: (previous) => previous,
  })
}
