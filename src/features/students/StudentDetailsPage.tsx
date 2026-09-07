import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App, Avatar, Button, Card, Descriptions, Flex, Popconfirm, Skeleton, Space, Tag, Typography } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useAllDepartments, useDeleteStudent, useStudentQuery } from '@/features/students/hooks'
import type { StudentStatus } from '@/types/student'

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: 'success',
  inactive: 'default',
  alumni: 'blue',
}

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const studentQuery = useStudentQuery(id)
  const departmentsQuery = useAllDepartments()
  const deleteStudent = useDeleteStudent()

  const department = useMemo(
    () => departmentsQuery.data?.data.find((d) => d.id === studentQuery.data?.departmentId),
    [departmentsQuery.data, studentQuery.data],
  )

  if (studentQuery.isPending) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Student not found.</Typography.Text>
      </Card>
    )
  }

  const student = studentQuery.data

  async function handleDelete() {
    await deleteStudent
      .mutateAsync(student.id, { onSuccess: () => navigate('/students') })
      .catch(() => message.error('Failed to remove student'))
  }

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Student details
        </Typography.Title>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/students/${student.id}/edit`)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove student"
            description="This cannot be undone."
            onConfirm={handleDelete}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      </Flex>

      <Card>
        <Flex gap={16} align="center" style={{ marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {student.firstName} {student.lastName}
            </Typography.Title>
            <Space size={8}>
              <Typography.Text type="secondary">{student.rollNumber}</Typography.Text>
              <Tag color={STATUS_COLOR[student.status]}>{student.status}</Tag>
            </Space>
          </div>
        </Flex>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Department">{department ? `${department.name} (${department.code})` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Gender">{student.gender}</Descriptions.Item>
          <Descriptions.Item label="Email">{student.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{student.phone}</Descriptions.Item>
          <Descriptions.Item label="Date of birth">{new Date(student.dateOfBirth).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Admission date">{new Date(student.admissionDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Guardian name">{student.guardianName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Guardian phone">{student.guardianPhone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {student.address || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/students">&larr; Back to students</Link>
      </div>
    </div>
  )
}
