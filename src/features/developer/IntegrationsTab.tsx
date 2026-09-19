import { useMemo, useState } from 'react'
import { Button, Card, Switch, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { IntegrationConfig, IntegrationProvider } from '@/services/api/integrationsApi'
import { useIntegrationsQuery, useUpsertIntegration } from '@/features/developer/hooks'
import { IntegrationSettingsModal } from '@/features/developer/IntegrationSettingsModal'

/**
 * The full provider union from the roadmap's Milestone 4 scope — rendered
 * even when the tenant hasn't configured one yet (it just appears as
 * disabled/unconfigured, matching the API's "only appears once configured" note).
 */
const ALL_PROVIDERS: IntegrationProvider[] = [
  'PAYMENT_GATEWAY',
  'EMAIL',
  'SMS',
  'FIREBASE',
  'GOOGLE_WORKSPACE',
  'MICROSOFT_365',
  'BIOMETRIC_ATTENDANCE',
  'ACCOUNTING_SOFTWARE',
  'LMS',
  'LIBRARY_SYSTEM',
]

const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  PAYMENT_GATEWAY: 'Payment gateway',
  EMAIL: 'Email',
  SMS: 'SMS',
  FIREBASE: 'Firebase',
  GOOGLE_WORKSPACE: 'Google Workspace',
  MICROSOFT_365: 'Microsoft 365',
  BIOMETRIC_ATTENDANCE: 'Biometric attendance',
  ACCOUNTING_SOFTWARE: 'Accounting software',
  LMS: 'LMS',
  LIBRARY_SYSTEM: 'Library system',
}

interface ProviderRow {
  provider: IntegrationProvider
  config: IntegrationConfig | undefined
}

export function IntegrationsTab() {
  const query = useIntegrationsQuery()
  const upsertIntegration = useUpsertIntegration()
  const [editingProvider, setEditingProvider] = useState<IntegrationProvider | undefined>(undefined)

  const configByProvider = useMemo(() => {
    const map = new Map<IntegrationProvider, IntegrationConfig>()
    for (const config of query.data ?? []) {
      map.set(config.provider, config)
    }
    return map
  }, [query.data])

  const rows: ProviderRow[] = ALL_PROVIDERS.map((provider) => ({ provider, config: configByProvider.get(provider) }))

  const columns: TableProps<ProviderRow>['columns'] = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      render: (value: IntegrationProvider) => PROVIDER_LABEL[value],
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, row) => (row.config ? <Typography.Text type="secondary">Configured</Typography.Text> : <Typography.Text type="secondary">Not configured</Typography.Text>),
    },
    {
      title: 'Enabled',
      key: 'enabled',
      width: 100,
      render: (_, row) => (
        <Switch
          checked={row.config?.enabled ?? false}
          onChange={(checked) =>
            upsertIntegration.mutate({
              provider: row.provider,
              input: { enabled: checked, settings: row.config?.settings ?? undefined },
            })
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, row) => (
        <Button size="small" onClick={() => setEditingProvider(row.provider)}>
          Edit settings
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Table<ProviderRow>
          rowKey="provider"
          columns={columns}
          dataSource={rows}
          loading={query.isFetching}
          pagination={false}
        />
      </Card>

      <IntegrationSettingsModal
        open={!!editingProvider}
        onClose={() => setEditingProvider(undefined)}
        provider={editingProvider ?? 'EMAIL'}
        config={editingProvider ? configByProvider.get(editingProvider) : undefined}
      />
    </div>
  )
}
