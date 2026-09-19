import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Faculty, FacultyStatus } from '@/services/api/facultyApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { useAllDepartmentsForFaculty, useDeleteFaculty, useFacultyQuery } from '@/features/faculty/hooks'

const STATUS_COLOR: Record<FacultyStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}

export function FacultyPage() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<FacultyStatus | undefined>(undefined)

  const departmentsQuery = useAllDepartmentsForFaculty()
  const query = useFacultyQuery({ page, pageSize, departmentId, status })
  const deleteFaculty = useDeleteFaculty()

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const dept of departmentsQuery.data?.data ?? []) map.set(dept.id, dept.name)
    return map
  }, [departmentsQuery.data])

  const handleDelete = useCallback(
    (faculty: Faculty) => deleteFaculty.mutateAsync(faculty.id).catch(() => undefined),
    [deleteFaculty],
  )

  const columns = useMemo<TableProps<Faculty>['columns']>(
    () => [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Email', dataIndex: 'email' },
      { title: 'Employee code', dataIndex: 'employeeCode' },
      {
        title: 'Department',
        dataIndex: 'departmentId',
        render: (departmentId: string) => departmentNameById.get(departmentId) ?? '—',
      },
      { title: 'Designation', dataIndex: 'designation' },
      { title: 'Experience (yrs)', dataIndex: 'experienceYears', width: 130 },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: FacultyStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: canManage ? 220 : 80,
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => navigate(`/faculty/${record.id}`)}>
              View
            </Button>
            {canManage && (
              <>
                <Button size="small" onClick={() => navigate(`/faculty/${record.id}/edit`)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Remove faculty member"
                  description={`Remove ${record.name}? This cannot be undone.`}
                  onConfirm={() => handleDelete(record)}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>
                    Remove
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        ),
      },
    ],
    [canManage, departmentNameById, handleDelete, navigate],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Faculty
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/faculty/new')}>
            Add faculty
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="Department"
            style={{ width: 220 }}
            value={departmentId}
            loading={departmentsQuery.isPending}
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

        <Table<Faculty>
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
    </div>
  )
}
