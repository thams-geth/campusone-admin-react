import { Drawer, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { WebhookDelivery, WebhookDeliveryStatus } from '@/services/api/webhooksApi'
import { useWebhookDeliveriesQuery } from '@/features/developer/hooks'
import { formatDateTime } from '@/utils/formatDate'

interface WebhookDeliveriesDrawerProps {
  open: boolean
  onClose: () => void
  endpointId: string | undefined
  endpointUrl: string | undefined
}

const STATUS_COLOR: Record<WebhookDeliveryStatus, string> = {
  PENDING: 'gold',
  DELIVERED: 'success',
  FAILED: 'error',
}

export function WebhookDeliveriesDrawer({ open, onClose, endpointId, endpointUrl }: WebhookDeliveriesDrawerProps) {
  const query = useWebhookDeliveriesQuery(open ? endpointId : undefined)

  const columns: TableProps<WebhookDelivery>['columns'] = [
    { title: 'Event', dataIndex: 'eventType' },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: WebhookDeliveryStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    { title: 'Attempts', dataIndex: 'attempts', width: 90, align: 'right' },
    {
      title: 'Response status',
      dataIndex: 'responseStatus',
      width: 130,
      render: (value: number | null) => value ?? '—',
    },
    {
      title: 'Last attempt',
      dataIndex: 'lastAttemptAt',
      width: 180,
      render: (value: string | null) => formatDateTime(value),
    },
  ]

  return (
    <Drawer title="Delivery history" open={open} onClose={onClose} size={640} destroyOnHidden>
      {endpointUrl && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {endpointUrl}
        </Typography.Paragraph>
      )}
      <Table<WebhookDelivery>
        rowKey="id"
        columns={columns}
        dataSource={query.data?.data}
        loading={query.isFetching}
        pagination={{ pageSize: query.data?.meta.pageSize ?? 10, total: query.data?.meta.total }}
      />
    </Drawer>
  )
}
