import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Program, ProgramStatus } from '@/services/api/programsApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { useAllDepartmentsForPrograms, useDeleteProgram, useProgramsQuery } from '@/features/programs/hooks'
import { ProgramFormDrawer } from '@/features/programs/ProgramFormDrawer'

const STATUS_COLOR: Record<ProgramStatus, string> = { ACTIVE: 'success', INACTIVE: 'default' }

export function ProgramsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<ProgramStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | undefined>(undefined)

  const query = useProgramsQuery({ page, pageSize, departmentId, status })
  const departmentsQuery = useAllDepartmentsForPrograms()
  const deleteProgram = useDeleteProgram()

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of departmentsQuery.data?.data ?? []) {
      map.set(d.id, d.name)
    }
    return map
  }, [departmentsQuery.data])

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (program: Program) => deleteProgram.mutateAsync(program.id).catch(() => undefined),
    [deleteProgram],
  )

  const columns = useMemo<TableProps<Program>['columns']>(
    () => [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Code', dataIndex: 'code', width: 120 },
      {
        title: 'Department',
        dataIndex: 'departmentId',
        render: (value: string) => departmentNameById.get(value) ?? value,
      },
      { title: 'Duration (years)', dataIndex: 'durationYears', width: 150, align: 'right' },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: ProgramStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
      },
      ...(canManage
        ? [
            {
              title: 'Actions',
              key: 'actions',
              width: 160,
              render: (_: unknown, record: Program) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingProgram(record)
                      setDrawerOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete program"
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
        : []),
    ],
    [canManage, departmentNameById, handleDelete],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Programs
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProgram(undefined)
              setDrawerOpen(true)
            }}
          >
            Add program
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            showSearch
            placeholder="Department"
            style={{ width: 240 }}
            loading={departmentsQuery.isPending}
            optionFilterProp="label"
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value)
              setPage(1)
            }}
            options={(departmentsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select
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

        <Table<Program>
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
        <ProgramFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} program={editingProgram} />
      )}
    </div>
  )
}
