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
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useAllDepartments, useDeleteStudent, useStudent360Query, useStudentQuery } from '@/features/students/hooks'
import type { StudentStatus, StudentSummary360 } from '@/types/student'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: 'success',
  inactive: 'default',
  alumni: 'blue',
}

/** The 360 overview's body — split out so the loading/error states above it stay simple. */
function Student360Overview({ summary }: { summary: StudentSummary360 }) {
  const { attendance, academics, fees, hostelAllocation, transportAllocation, library, documents, certificateRequests, activities, leave } =
    summary

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={5}>Attendance</Typography.Title>
        <Flex gap={32} align="center" wrap>
          <Progress type="circle" size={72} percent={Math.round(attendance.attendancePercentage)} />
          <Row gutter={24}>
            <Col><Statistic title="Total" value={attendance.totalRecords} /></Col>
            <Col><Statistic title="Present" value={attendance.presentCount} /></Col>
            <Col><Statistic title="Absent" value={attendance.absentCount} /></Col>
            <Col><Statistic title="Late" value={attendance.lateCount} /></Col>
            <Col><Statistic title="Excused" value={attendance.excusedCount} /></Col>
            <Col><Statistic title="On leave" value={attendance.onLeaveCount} /></Col>
          </Row>
        </Flex>
      </div>

      <Divider style={{ margin: 0 }} />

      <div>
        <Typography.Title level={5}>Academics</Typography.Title>
        {academics.cgpa === null ? (
          <Typography.Text type="secondary">Not yet available.</Typography.Text>
        ) : (
          <Statistic title="CGPA" value={academics.cgpa} precision={2} />
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      <div>
        <Typography.Title level={5}>Fees</Typography.Title>
        <Row gutter={24}>
          <Col><Statistic title="Invoices" value={fees.invoiceCount} /></Col>
          <Col><Statistic title="Total invoiced" value={fees.totalInvoiced} prefix="₹" /></Col>
          <Col>
            <Statistic
              title="Outstanding"
              value={fees.totalOutstanding}
              prefix="₹"
              valueStyle={fees.overdueCount > 0 ? { color: '#cf1322' } : undefined}
            />
          </Col>
          <Col>
            <Statistic
              title="Overdue invoices"
              value={fees.overdueCount}
              valueStyle={fees.overdueCount > 0 ? { color: '#cf1322' } : undefined}
            />
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: 0 }} />

      <Row gutter={24}>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Hostel</Typography.Title>
          {hostelAllocation ? (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Hostel">{hostelAllocation.hostelName}</Descriptions.Item>
              <Descriptions.Item label="Room">{hostelAllocation.roomNumber}</Descriptions.Item>
              <Descriptions.Item label="Bed">{hostelAllocation.bedNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">{hostelAllocation.status}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">Not allocated.</Typography.Text>
          )}
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Transport</Typography.Title>
          {transportAllocation ? (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Route">{transportAllocation.routeName}</Descriptions.Item>
              <Descriptions.Item label="Stop">{transportAllocation.stopName}</Descriptions.Item>
              <Descriptions.Item label="Status">{transportAllocation.status}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">Not allocated.</Typography.Text>
          )}
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Library</Typography.Title>
          <Space size={24}>
            <Statistic title="Active issues" value={library.activeIssueCount} />
            <Statistic title="Overdue issues" value={library.overdueIssueCount} />
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: 0 }} />

      <Row gutter={24}>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Documents</Typography.Title>
          {documents.length === 0 ? (
            <Empty description="No documents" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={documents.slice(0, 10)}
              renderItem={(doc) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <span>{doc.type}</span>
                    <Typography.Text type="secondary">
                      {doc.status} · {formatDate(doc.createdAt)}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Certificate requests</Typography.Title>
          {certificateRequests.length === 0 ? (
            <Empty description="No requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={certificateRequests.slice(0, 10)}
              renderItem={(req) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <span>{req.certificateTypeId}</span>
                    <Typography.Text type="secondary">
                      {req.status} · {formatDate(req.createdAt)}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Typography.Title level={5}>Activities</Typography.Title>
          {activities.length === 0 ? (
            <Empty description="No activities" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={activities.slice(0, 10)}
              renderItem={(activity) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <span>{activity.title}</span>
                    <Typography.Text type="secondary">
                      {activity.type} · {formatDate(activity.date)}
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
        <Typography.Title level={5}>Leave</Typography.Title>
        <Space size={24} style={{ marginBottom: 12 }}>
          <Statistic title="Pending" value={leave.pendingCount} />
          <Statistic title="Approved" value={leave.approvedCount} />
          <Statistic title="Rejected" value={leave.rejectedCount} />
        </Space>
        {leave.recent.length === 0 ? (
          <Typography.Text type="secondary">No recent leave requests.</Typography.Text>
        ) : (
          <List
            size="small"
            dataSource={leave.recent}
            renderItem={(item) => (
              <List.Item>
                {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.status}
              </List.Item>
            )}
          />
        )}
      </div>
    </Space>
  )
}

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const studentQuery = useStudentQuery(id)
  const departmentsQuery = useAllDepartments()
  const deleteStudent = useDeleteStudent()
  // Independent of the base profile fetch above — both load concurrently, neither blocks the other.
  const summary360Query = useStudent360Query(id)

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
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
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

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
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

      <Card title="360 overview" style={{ marginTop: 16 }}>
        {summary360Query.isPending ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : summary360Query.isError || !summary360Query.data ? (
          <Typography.Text type="secondary">360 overview unavailable.</Typography.Text>
        ) : (
          <Student360Overview summary={summary360Query.data} />
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/students">&larr; Back to students</Link>
      </div>
    </div>
  )
}
