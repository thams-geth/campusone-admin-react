import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import type { Section, SectionStatus } from '@/services/api/sectionsApi'
import { useAllBatchesForSections, useDeleteSection, useSectionsQuery } from '@/features/sections/hooks'
import { SectionFormDrawer } from '@/features/sections/SectionFormDrawer'

const STATUS_COLOR: Record<SectionStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}

export function SectionsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [batchId, setBatchId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<SectionStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | undefined>(undefined)

  const query = useSectionsQuery({ page, pageSize, batchId, status })
  const batchesQuery = useAllBatchesForSections()
  const deleteSection = useDeleteSection()

  const batchById = useMemo(() => new Map((batchesQuery.data?.data ?? []).map((b) => [b.id, b])), [batchesQuery.data])

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (section: Section) => deleteSection.mutateAsync(section.id).catch(() => undefined),
    [deleteSection],
  )

  const columns = useMemo<TableProps<Section>['columns']>(() => {
    const base: TableProps<Section>['columns'] = [
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Batch',
        dataIndex: 'batchId',
        render: (value: string) => batchById.get(value)?.name ?? value,
      },
      { title: 'Semester', dataIndex: 'currentSemester', width: 110, align: 'right' },
      {
        title: 'Capacity',
        dataIndex: 'capacity',
        width: 110,
        align: 'right',
        render: (value: number | null) => value ?? '—',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (value: SectionStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
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
                setEditingSection(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete section"
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
  }, [canManage, batchById, handleDelete])

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Sections
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSection(undefined)
              setDrawerOpen(true)
            }}
          >
            Add section
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Batch"
            style={{ width: 220 }}
            value={batchId}
            loading={batchesQuery.isPending}
            onChange={(value) => {
              setBatchId(value)
              setPage(1)
            }}
            options={(batchesQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select<SectionStatus | undefined>
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
            ]}
          />
        </Flex>

        <Table<Section>
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
        <SectionFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} section={editingSection} />
      )}
    </div>
  )
}
