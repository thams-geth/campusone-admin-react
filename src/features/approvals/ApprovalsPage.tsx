import { useMemo, useState } from 'react'
import { Button, Card, Flex, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { ApprovalRequest, ApprovalStatus } from '@/services/api/approvalsApi'
import { useApprovalsQuery, useApproveRequest, useRejectRequest } from '@/features/approvals/hooks'
import { formatDateTime } from '@/utils/formatDate'

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'success',
  REJECTED: 'error',
}

type DecisionAction = 'approve' | 'reject'

/** Optional decision-notes prompt shared by both Approve and Reject — neither notes field is required. */
function DecisionModal({
  request,
  action,
  onClose,
}: {
  request: ApprovalRequest | undefined
  action: DecisionAction | undefined
  onClose: () => void
}) {
  const [notes, setNotes] = useState('')
  const approveRequest = useApproveRequest()
  const rejectRequest = useRejectRequest()
  const mutation = action === 'reject' ? rejectRequest : approveRequest

  function handleClose() {
    setNotes('')
    onClose()
  }

  return (
    <Modal
      title={action === 'reject' ? 'Reject request' : 'Approve request'}
      open={!!request && !!action}
      onCancel={handleClose}
      okText={action === 'reject' ? 'Reject' : 'Approve'}
      okButtonProps={{ danger: action === 'reject', loading: mutation.isPending }}
      onOk={() => {
        if (!request) return
        mutation
          .mutateAsync({ id: request.id, input: notes.trim() ? { decisionNotes: notes.trim() } : undefined }, { onSuccess: handleClose })
          .catch(() => undefined)
      }}
    >
      <Typography.Paragraph type="secondary">
        Type: {request?.type} · Entity: {request?.entity} ({request?.entityId})
      </Typography.Paragraph>
      <Input.TextArea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Decision notes (optional)"
      />
    </Modal>
  )
}

export function ApprovalsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<ApprovalStatus | undefined>(undefined)
  const [type, setType] = useState<string | undefined>(undefined)
  const [decision, setDecision] = useState<{ request: ApprovalRequest; action: DecisionAction } | undefined>(undefined)

  const query = useApprovalsQuery({ page, pageSize, status, type: type || undefined })

  const typeOptions = useMemo(() => {
    const types = new Set((query.data?.data ?? []).map((r) => r.type))
    return Array.from(types).map((t) => ({ value: t, label: t }))
  }, [query.data])

  const columns: TableProps<ApprovalRequest>['columns'] = [
    { title: 'Type', dataIndex: 'type', width: 160 },
    {
      title: 'Entity',
      key: 'entity',
      render: (_, record) => (
        <span>
          {record.entity} <Typography.Text type="secondary">({record.entityId})</Typography.Text>
        </span>
      ),
    },
    { title: 'Requested by', dataIndex: 'requestedByUserId', width: 220 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: ApprovalStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: 'Decided by',
      key: 'decidedBy',
      width: 220,
      render: (_, record) => (record.decidedByUserId ? record.decidedByUserId : '—'),
    },
    { title: 'Decided at', dataIndex: 'decidedAt', width: 170, render: (value: string | null) => formatDateTime(value) },
    {
      title: 'Decision notes',
      dataIndex: 'decisionNotes',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        record.status === 'PENDING' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => setDecision({ request: record, action: 'approve' })}>
              Approve
            </Button>
            <Button size="small" danger onClick={() => setDecision({ request: record, action: 'reject' })}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Approvals
      </Typography.Title>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<ApprovalStatus | undefined>
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
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Type"
            style={{ width: 200 }}
            value={type}
            onChange={(value) => {
              setType(value)
              setPage(1)
            }}
            options={typeOptions}
          />
        </Flex>

        <Table<ApprovalRequest>
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

      <DecisionModal
        request={decision?.request}
        action={decision?.action}
        onClose={() => setDecision(undefined)}
      />
    </div>
  )
}
