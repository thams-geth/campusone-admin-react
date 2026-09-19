import { useMemo, useState } from 'react'
import { Button, Card, Flex, Input, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { AuditLog } from '@/services/api/auditApi'
import { formatDateTime } from '@/utils/formatDate'
import { useAuditLogsQuery } from '@/features/audit/hooks'
import { AuditLogDetailsModal } from '@/features/audit/AuditLogDetailsModal'

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [entity, setEntity] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditLog | undefined>(undefined)

  const query = useAuditLogsQuery({ page, pageSize, entity: entity || undefined, actorUserId: actorUserId || undefined })

  const columns = useMemo<TableProps<AuditLog>['columns']>(
    () => [
      { title: 'Timestamp', dataIndex: 'createdAt', width: 180, render: (value: string) => formatDateTime(value) },
      { title: 'Actor', dataIndex: 'actorName', width: 160 },
      { title: 'Message', dataIndex: 'message' },
      {
        title: 'Entity',
        key: 'entity',
        width: 200,
        render: (_, record) => (record.entity ? `${record.entity} · ${record.entityId ?? '—'}` : '—'),
      },
      {
        title: 'Action',
        dataIndex: 'action',
        width: 110,
        render: (value: string | null) => (value ? <Tag>{value}</Tag> : '—'),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 110,
        render: (_, record) => (
          <Button size="small" onClick={() => setSelectedEntry(record)}>
            Details
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Audit Log
      </Typography.Title>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            placeholder="Filter by entity (e.g. Student, FeeInvoice)"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 280 }}
            onChange={(e) => {
              setEntity(e.target.value)
              setPage(1)
            }}
          />
          <Input
            allowClear
            placeholder="Filter by actor user ID"
            style={{ maxWidth: 240 }}
            onChange={(e) => {
              setActorUserId(e.target.value)
              setPage(1)
            }}
          />
        </Flex>

        <Table<AuditLog>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          onRow={(record) => ({ onClick: () => setSelectedEntry(record), style: { cursor: 'pointer' } })}
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

      <AuditLogDetailsModal open={!!selectedEntry} onClose={() => setSelectedEntry(undefined)} entry={selectedEntry} />
    </div>
  )
}
