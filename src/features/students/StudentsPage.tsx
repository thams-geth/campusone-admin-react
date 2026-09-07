import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Flex, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import type { Student, StudentStatus } from '@/types/student'
import { useAllDepartments, useDeleteStudent, useStudentsQuery } from '@/features/students/hooks'

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: 'success',
  inactive: 'default',
  alumni: 'blue',
}

export function StudentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<StudentStatus | undefined>(undefined)

  const departmentsQuery = useAllDepartments()
  const query = useStudentsQuery({ page, pageSize, search, departmentId, status })
  const deleteStudent = useDeleteStudent()

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const dept of departmentsQuery.data?.data ?? []) map.set(dept.id, dept.name)
    return map
  }, [departmentsQuery.data])

  const handleDelete = useCallback((student: Student) => deleteStudent.mutateAsync(student.id).catch(() => undefined), [
    deleteStudent,
  ])

  const columns = useMemo<TableProps<Student>['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'firstName',
        render: (_, record) => (
          <Flex align="center" gap={8}>
            <Avatar icon={<UserOutlined />} />
            <div>
              <Typography.Text strong>
                {record.firstName} {record.lastName}
              </Typography.Text>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {record.rollNumber}
                </Typography.Text>
              </div>
            </div>
          </Flex>
        ),
      },
      {
        title: 'Department',
        dataIndex: 'departmentId',
        render: (departmentId: string) => departmentNameById.get(departmentId) ?? '—',
      },
      { title: 'Email', dataIndex: 'email' },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: StudentStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 200,
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => navigate(`/students/${record.id}`)}>
              View
            </Button>
            <Button size="small" onClick={() => navigate(`/students/${record.id}/edit`)}>
              Edit
            </Button>
            <Popconfirm
              title="Remove student"
              description={`Remove ${record.firstName} ${record.lastName}? This cannot be undone.`}
              onConfirm={() => handleDelete(record)}
              okText="Remove"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>
                Remove
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [departmentNameById, handleDelete, navigate],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Students
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/students/new')}>
          Add student
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            placeholder="Search by name, email, or roll number"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 320 }}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select
            allowClear
            placeholder="Department"
            style={{ width: 220 }}
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
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'alumni', label: 'Alumni' },
            ]}
          />
        </Flex>

        <Table<Student>
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
