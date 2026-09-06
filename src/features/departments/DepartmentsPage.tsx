import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { Department } from '@/types/department'
import { useDepartmentsQuery, useDeleteDepartment } from '@/features/departments/hooks'
import { DepartmentFormDrawer } from '@/features/departments/DepartmentFormDrawer'

export function DepartmentsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Department['status'] | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>(undefined)

  const query = useDepartmentsQuery({ page, pageSize, search, status })
  const deleteDepartment = useDeleteDepartment()

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (department: Department) => deleteDepartment.mutateAsync(department.id).catch(() => undefined),
    [deleteDepartment],
  )

  const columns = useMemo<TableProps<Department>['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (_, record) => (
          <div>
            <Typography.Text strong>{record.name}</Typography.Text>
            {record.headOfDepartment && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {record.headOfDepartment}
                </Typography.Text>
              </div>
            )}
          </div>
        ),
      },
      { title: 'Code', dataIndex: 'code', width: 100 },
      { title: 'Students', dataIndex: 'studentCount', width: 100, align: 'right' },
      { title: 'Faculty', dataIndex: 'facultyCount', width: 100, align: 'right' },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: Department['status']) => (
          <Tag color={value === 'active' ? 'success' : 'default'}>{value}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 160,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditingDepartment(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete department"
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
    ],
    [handleDelete],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Departments
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDepartment(undefined)
            setDrawerOpen(true)
          }}
        >
          Add department
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            placeholder="Search by name, code, or HOD"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 320 }}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
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
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </Flex>

        <Table<Department>
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

      <DepartmentFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} department={editingDepartment} />
    </div>
  )
}
