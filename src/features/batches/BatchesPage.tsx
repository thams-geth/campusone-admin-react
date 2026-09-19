import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import type { Batch, BatchStatus } from '@/services/api/batchesApi'
import {
  useAllAcademicYearsForBatches,
  useAllProgramsForBatches,
  useBatchesQuery,
  useDeleteBatch,
} from '@/features/batches/hooks'
import { BatchFormDrawer } from '@/features/batches/BatchFormDrawer'

const STATUS_COLOR: Record<BatchStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  GRADUATED: 'blue',
}

export function BatchesPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<BatchStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | undefined>(undefined)

  const query = useBatchesQuery({ page, pageSize, programId, academicYearId, status })
  const programsQuery = useAllProgramsForBatches()
  const academicYearsQuery = useAllAcademicYearsForBatches()
  const deleteBatch = useDeleteBatch()

  const programById = useMemo(
    () => new Map((programsQuery.data?.data ?? []).map((p) => [p.id, p])),
    [programsQuery.data],
  )
  const academicYearById = useMemo(
    () => new Map((academicYearsQuery.data?.data ?? []).map((y) => [y.id, y])),
    [academicYearsQuery.data],
  )

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (batch: Batch) => deleteBatch.mutateAsync(batch.id).catch(() => undefined),
    [deleteBatch],
  )

  const columns = useMemo<TableProps<Batch>['columns']>(() => {
    const base: TableProps<Batch>['columns'] = [
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Program',
        dataIndex: 'programId',
        render: (value: string) => programById.get(value)?.name ?? value,
      },
      {
        title: 'Academic year',
        dataIndex: 'academicYearId',
        render: (value: string) => academicYearById.get(value)?.name ?? value,
      },
      { title: 'Start year', dataIndex: 'startYear', width: 110, align: 'right' },
      { title: 'End year', dataIndex: 'endYear', width: 110, align: 'right' },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (value: BatchStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
      },
    ]

    if (!canManage) return base

    return [
      ...base,
      {
        title: 'Actions',
        key: 'actions',
        width: 160,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditingBatch(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete batch"
              description={`Delete "${record.name}"? This cannot be undone.`}
              onConfirm={() => handleDelete(record)}
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
  }, [canManage, programById, academicYearById, handleDelete])

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Batches
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBatch(undefined)
              setDrawerOpen(true)
            }}
          >
            Add batch
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Program"
            style={{ width: 220 }}
            value={programId}
            loading={programsQuery.isPending}
            onChange={(value) => {
              setProgramId(value)
              setPage(1)
            }}
            options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Academic year"
            style={{ width: 200 }}
            value={academicYearId}
            loading={academicYearsQuery.isPending}
            onChange={(value) => {
              setAcademicYearId(value)
              setPage(1)
            }}
            options={(academicYearsQuery.data?.data ?? []).map((y) => ({ value: y.id, label: y.name }))}
          />
          <Select<BatchStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'GRADUATED', label: 'Graduated' },
            ]}
          />
        </Flex>

        <Table<Batch>
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

      {canManage && (
        <BatchFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} batch={editingBatch} />
      )}
    </div>
  )
}
