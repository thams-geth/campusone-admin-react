import { Tabs, Typography } from 'antd'
import { ApiKeysTab } from '@/features/developer/ApiKeysTab'
import { WebhooksTab } from '@/features/developer/WebhooksTab'
import { IntegrationsTab } from '@/features/developer/IntegrationsTab'

export function DeveloperSettingsPage() {
  const items = [
    { key: 'api-keys', label: 'API Keys', children: <ApiKeysTab /> },
    { key: 'webhooks', label: 'Webhooks', children: <WebhooksTab /> },
    { key: 'integrations', label: 'Integrations', children: <IntegrationsTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Developer settings
      </Typography.Title>
      <Tabs defaultActiveKey="api-keys" items={items} />
    </div>
  )
}
