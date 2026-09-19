import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Popconfirm,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ApiError } from '@/types/common'
import type { BillingInvoice, BillingInvoiceStatus, SubscriptionStatus } from '@/services/api/billingApi'
import {
  useCancelSubscription,
  useInvoicesQuery,
  usePayInvoice,
  useSubscriptionQuery,
  useUsageQuery,
} from '@/features/billing/hooks'
import { ChangePlanModal } from '@/features/billing/ChangePlanModal'
import { CreateInvoiceFormDrawer } from '@/features/billing/CreateInvoiceFormDrawer'
import { formatDate } from '@/utils/formatDate'

const SUBSCRIPTION_STATUS_COLOR: Record<SubscriptionStatus, string> = {
  TRIALING: 'blue',
  ACTIVE: 'green',
  PAST_DUE: 'gold',
  CANCELED: 'red',
}

const INVOICE_STATUS_COLOR: Record<BillingInvoiceStatus, string> = {
  PENDING: 'gold',
  PAID: 'green',
  OVERDUE: 'red',
}

/**
 * Exported so tests can render just this tab's content directly, without
 * antd's Tabs wrapper — Tabs + a Popconfirm inside one of its panes causes a
 * severe jsdom-only slowdown in tests (not a real bug, confirmed fine in
 * real browsers). See LeavePage.tsx / LeavePage.test.tsx for the same
 * pattern applied there.
 */
export function SubscriptionTab() {
  const query = useSubscriptionQuery()
  const cancelSubscription = useCancelSubscription()
  const [planModalOpen, setPlanModalOpen] = useState(false)

  const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404

  if (query.isPending) {
    return (
      <Card>
        <Skeleton active />
      </Card>
    )
  }

  if (notFound) {
    return (
      <Card>
        <Empty description="This tenant hasn't picked a plan yet">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPlanModalOpen(true)}>
            Choose a plan
          </Button>
        </Empty>
        <ChangePlanModal key={String(planModalOpen)} open={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      </Card>
    )
  }

  if (query.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load subscription"
        description={query.error instanceof ApiError ? query.error.message : undefined}
      />
    )
  }

  const subscription = query.data!
  const canCancel = !subscription.cancelAtPeriodEnd && subscription.status !== 'CANCELED'

  return (
    <Card>
      <Flex justify="space-between" align="flex-start" wrap style={{ marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {subscription.plan.name}
          </Typography.Title>
          <Typography.Text type="secondary">₹{subscription.plan.priceMonthly.toLocaleString()}/month</Typography.Text>
        </div>
        <Tag color={SUBSCRIPTION_STATUS_COLOR[subscription.status]}>{subscription.status}</Tag>
      </Flex>

      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Current period start">{formatDate(subscription.currentPeriodStart)}</Descriptions.Item>
        <Descriptions.Item label="Current period end">{formatDate(subscription.currentPeriodEnd)}</Descriptions.Item>
        <Descriptions.Item label="Cancels at period end">
          {subscription.cancelAtPeriodEnd ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <Space>
        <Button onClick={() => setPlanModalOpen(true)}>Change plan</Button>
        {canCancel && (
          <Popconfirm
            title="Cancel subscription"
            description="The subscription will remain active until the end of the current period."
            onConfirm={() => cancelSubscription.mutate()}
            okText="Cancel subscription"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Cancel subscription</Button>
          </Popconfirm>
        )}
      </Space>

      <ChangePlanModal
        key={String(planModalOpen)}
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        currentPlanId={subscription.planId}
      />
    </Card>
  )
}

/**
 * Exported for the same reason as SubscriptionTab above — this tab's "Pay"
 * action uses a Popconfirm too.
 */
export function InvoicesTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<BillingInvoiceStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useInvoicesQuery({ page, pageSize, status })
  const payInvoice = usePayInvoice()

  const columns: TableProps<BillingInvoice>['columns'] = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: BillingInvoiceStatus) => <Tag color={INVOICE_STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Period start',
      dataIndex: 'periodStart',
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Period end',
      dataIndex: 'periodEnd',
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Paid at',
      dataIndex: 'paidAt',
      width: 130,
      render: (value: string | null) => (value ? formatDate(value) : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) =>
        record.status === 'PENDING' || record.status === 'OVERDUE' ? (
          <Popconfirm
            title="Mark invoice as paid"
            onConfirm={() => payInvoice.mutate(record.id)}
            okText="Pay"
          >
            <Button size="small" type="primary">
              Pay
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Create invoice
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<BillingInvoiceStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'PAID', label: 'Paid' },
              { value: 'OVERDUE', label: 'Overdue' },
            ]}
          />
        </Flex>

        <Table<BillingInvoice>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <CreateInvoiceFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null
  const percent = unlimited ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100))

  return (
    <Card size="small">
      <Statistic title={label} value={used} suffix={unlimited ? '/ unlimited' : `/ ${limit}`} />
      {!unlimited && <Progress percent={percent} status={percent >= 100 ? 'exception' : 'active'} showInfo={false} />}
    </Card>
  )
}

function UsageTab() {
  const query = useUsageQuery()

  if (query.isPending) {
    return (
      <Card>
        <Skeleton active />
      </Card>
    )
  }

  if (query.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load usage"
        description={query.error instanceof ApiError ? query.error.message : undefined}
      />
    )
  }

  const usage = query.data!

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <UsageStat label="Students" used={usage.students.used} limit={usage.students.limit} />
      </Col>
      <Col xs={24} sm={12}>
        <UsageStat label="Faculty" used={usage.faculty.used} limit={usage.faculty.limit} />
      </Col>
    </Row>
  )
}

export function BillingPage() {
  const items = [
    { key: 'subscription', label: 'Subscription', children: <SubscriptionTab /> },
    { key: 'invoices', label: 'Invoices', children: <InvoicesTab /> },
    { key: 'usage', label: 'Usage', children: <UsageTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Billing
      </Typography.Title>
      <Tabs defaultActiveKey="subscription" items={items} />
    </div>
  )
}
