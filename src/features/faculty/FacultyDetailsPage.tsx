import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  List,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { useAllDepartmentsForFaculty, useDeleteFaculty, useFaculty360Query, useFacultyDetailQuery } from '@/features/faculty/hooks'
import type { FacultyStatus, FacultySummary360 } from '@/services/api/facultyApi'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<FacultyStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}

/** The 360 overview's body — split out so the loading/error states above it stay simple. */
function Faculty360Overview({ summary }: { summary: FacultySummary360 }) {
  const { teaching, timetable, attendance, assignments, leaveReviewed } = summary

  const timetableColumns: TableProps<FacultySummary360['timetable']['entries'][number]>['columns'] = [
    { title: 'Day', dataIndex: 'dayOfWeek' },
    { title: 'Time', key: 'time', render: (_, row) => `${row.startTime} – ${row.endTime}` },
    { title: 'Section', dataIndex: 'sectionName' },
    { title: 'Subject', dataIndex: 'subjectName' },
    { title: 'Room', dataIndex: 'roomName' },
  ]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={5}>Teaching load</Typography.Title>
        <Statistic title="Subjects" value={teaching.subjectCount} style={{ marginBottom: 12 }} />
        {teaching.subjects.length === 0 ? (
          <Typography.Text type="secondary">No subjects assigned.</Typography.Text>
        ) : (
          <List
            size="small"
            dataSource={teaching.subjects}
            renderItem={(subject) => (
              <List.Item>
                {subject.code} — {subject.name} (semester {subject.semesterNumber}, {subject.credits} credits)
              </List.Item>
            )}
          />
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      <div>
        <Typography.Title level={5}>Timetable</Typography.Title>
        <Statistic title="Weekly periods" value={timetable.weeklyPeriods} style={{ marginBottom: 12 }} />
        {timetable.entries.length === 0 ? (
          <Typography.Text type="secondary">No timetable entries.</Typography.Text>
        ) : (
          <Table
            size="small"
            rowKey="id"
            columns={timetableColumns}
            dataSource={timetable.entries}
            pagination={false}
          />
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Typography.Title level={5}>Attendance sessions</Typography.Title>
          <Statistic title="Sessions taken" value={attendance.sessionsTaken} style={{ marginBottom: 12 }} />
          {attendance.recentSessions.length === 0 ? (
            <Empty description="No sessions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={attendance.recentSessions}
              renderItem={(session) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <span>
                      {session.sectionName} — {session.subjectName}
                    </span>
                    <Typography.Text type="secondary">
                      {session.status} · {formatDate(session.date)}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Col>
        <Col xs={24} sm={12}>
          <Typography.Title level={5}>Assignments</Typography.Title>
          <Statistic title="Assignments" value={assignments.count} style={{ marginBottom: 12 }} />
          {assignments.recent.length === 0 ? (
            <Empty description="No assignments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={assignments.recent}
              renderItem={(assignment) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <span>{assignment.title}</span>
                    <Typography.Text type="secondary">
                      {assignment.status} · due {formatDate(assignment.dueDate)}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Col>
      </Row>

      <Divider style={{ margin: 0 }} />

      <div>
        <Typography.Title level={5}>Leave requests reviewed</Typography.Title>
        <Statistic title="Reviewed" value={leaveReviewed.count} />
      </div>
    </Space>
  )
}

export function FacultyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const facultyQuery = useFacultyDetailQuery(id)
  const departmentsQuery = useAllDepartmentsForFaculty()
  const deleteFaculty = useDeleteFaculty()
  // Independent of the base profile fetch above — both load concurrently, neither blocks the other.
  const summary360Query = useFaculty360Query(id)

  const department = useMemo(
    () => departmentsQuery.data?.data.find((d) => d.id === facultyQuery.data?.departmentId),
    [departmentsQuery.data, facultyQuery.data],
  )

  if (facultyQuery.isPending) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (facultyQuery.isError || !facultyQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Faculty member not found.</Typography.Text>
      </Card>
    )
  }

  const faculty = facultyQuery.data

  async function handleDelete() {
    await deleteFaculty
      .mutateAsync(faculty.id, { onSuccess: () => navigate('/faculty') })
      .catch(() => message.error('Failed to remove faculty member'))
  }

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Faculty details
        </Typography.Title>
        {canManage && (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/faculty/${faculty.id}/edit`)}>
              Edit
            </Button>
            <Popconfirm
              title="Remove faculty member"
              description="This cannot be undone."
              onConfirm={handleDelete}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        )}
      </Flex>

      <Card>
        <Flex gap={16} align="center" style={{ marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {faculty.name}
            </Typography.Title>
            <Space size={8}>
              <Typography.Text type="secondary">{faculty.employeeCode}</Typography.Text>
              <Tag color={STATUS_COLOR[faculty.status]}>{faculty.status}</Tag>
            </Space>
          </div>
        </Flex>

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Department">{department ? `${department.name} (${department.code})` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Designation">{faculty.designation}</Descriptions.Item>
          <Descriptions.Item label="Email">{faculty.email}</Descriptions.Item>
          <Descriptions.Item label="Qualification">{faculty.qualification || '—'}</Descriptions.Item>
          <Descriptions.Item label="Experience">{faculty.experienceYears} years</Descriptions.Item>
          <Descriptions.Item label="Joining date">{formatDate(faculty.joiningDate)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="360 overview" style={{ marginTop: 16 }}>
        {summary360Query.isPending ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : summary360Query.isError || !summary360Query.data ? (
          <Typography.Text type="secondary">360 overview unavailable.</Typography.Text>
        ) : (
          <Faculty360Overview summary={summary360Query.data} />
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/faculty">&larr; Back to faculty</Link>
      </div>
    </div>
  )
}
