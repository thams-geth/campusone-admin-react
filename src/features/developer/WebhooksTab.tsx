import { useState } from 'react'
import { Button, Card, Flex, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { WebhookEndpoint } from '@/services/api/webhooksApi'
import {
  useDeleteWebhookEndpoint,
  useUpdateWebhookEndpoint,
  useWebhookEndpointsQuery,
} from '@/features/developer/hooks'
import { WebhookFormDrawer } from '@/features/developer/WebhookFormDrawer'
import { WebhookDeliveriesDrawer } from '@/features/developer/WebhookDeliveriesDrawer'

/** Masked by default — it's a real HMAC secret, not something to show casually. Click to reveal per row. */
function SecretCell({ secret }: { secret: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <Space>
      <Typography.Text code>{revealed ? secret : '••••••••••••'}</Typography.Text>
      <Button
        type="text"
        size="small"
        icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
      />
    </Space>
  )
}

/**
 * Exported so tests can render just this tab's content directly, without
 * antd's Tabs wrapper — see the Tabs+Popconfirm jsdom slowdown note in
 * LeavePage.tsx; the delete action here uses the same Popconfirm pattern.
 */
export function WebhooksTab() {
  const query = useWebhookEndpointsQuery()
  const updateWebhookEndpoint = useUpdateWebhookEndpoint()
  const deleteWebhookEndpoint = useDeleteWebhookEndpoint()

  const [formOpen, setFormOpen] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | undefined>(undefined)
  const [deliveriesEndpoint, setDeliveriesEndpoint] = useState<WebhookEndpoint | undefined>(undefined)

  const columns: TableProps<WebhookEndpoint>['columns'] = [
    { title: 'URL', dataIndex: 'url', ellipsis: true },
    {
      title: 'Event types',
      dataIndex: 'eventTypes',
      render: (value: string[]) => (
        <Space wrap size={[4, 4]}>
          {value.map((eventType) => (
            <Tag key={eventType}>{eventType}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Secret',
      dataIndex: 'secret',
      width: 220,
      render: (value: string) => <SecretCell secret={value} />,
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 100,
      render: (value: boolean, record) => (
        <Switch
          checked={value}
          onChange={(checked) => updateWebhookEndpoint.mutate({ id: record.id, input: { enabled: checked } })}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setDeliveriesEndpoint(record)}>
            Deliveries
          </Button>
          <Button
            size="small"
            onClick={() => {
              setEditingEndpoint(record)
              setFormOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete webhook endpoint"
            description="This cannot be undone. Any integration relying on this endpoint will stop receiving events."
            onConfirm={() => deleteWebhookEndpoint.mutateAsync(record.id).catch(() => undefined)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingEndpoint(undefined)
            setFormOpen(true)
          }}
        >
          Add endpoint
        </Button>
      </Flex>

      <Card>
        <Table<WebhookEndpoint>
          rowKey="id"
          columns={columns}
          dataSource={query.data}
          loading={query.isFetching}
          pagination={false}
        />
      </Card>

      <WebhookFormDrawer open={formOpen} onClose={() => setFormOpen(false)} endpoint={editingEndpoint} />
      <WebhookDeliveriesDrawer
        open={!!deliveriesEndpoint}
        onClose={() => setDeliveriesEndpoint(undefined)}
        endpointId={deliveriesEndpoint?.id}
        endpointUrl={deliveriesEndpoint?.url}
      />
    </div>
  )
}
