import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { listStudents } from '@/services/api/studentsApi'
import type { AssignmentStatus, AssignmentSubmission, AssignmentSubmissionStatus } from '@/services/api/assignmentsApi'
import {
  useAllSectionsForAssignments,
  useAllSubjectsForAssignments,
  useAssignmentQuery,
  useAssignmentSubmissionsQuery,
  useCloseAssignment,
  useDeleteAssignment,
  useEvaluateAssignmentSubmission,
  usePublishAssignment,
} from '@/features/assignments/hooks'
import { AssignmentFormDrawer } from '@/features/assignments/AssignmentFormDrawer'

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'blue',
  CLOSED: 'green',
}

const SUBMISSION_STATUS_COLOR: Record<AssignmentSubmissionStatus, string> = {
  SUBMITTED: 'blue',
  LATE: 'orange',
  EVALUATED: 'green',
}

/** All students, for resolving names in the submissions table — same "page 1 of 100" pattern as other lookups. */
function useAllStudentsForAssignments() {
  return useQuery({ queryKey: ['students', 'all'], queryFn: () => listStudents({ page: 1, pageSize: 100 }) })
}

export function AssignmentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<AssignmentSubmission | undefined>(undefined)
  const [marksObtained, setMarksObtained] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')

  const assignmentQuery = useAssignmentQuery(id)
  const submissionsQuery = useAssignmentSubmissionsQuery(id)
  const subjectsQuery = useAllSubjectsForAssignments()
  const sectionsQuery = useAllSectionsForAssignments()
  const studentsQuery = useAllStudentsForAssignments()

  const deleteAssignment = useDeleteAssignment()
  const publishAssignment = usePublishAssignment()
  const closeAssignment = useCloseAssignment()
  const evaluateSubmission = useEvaluateAssignmentSubmission(id)

  const subject = useMemo(
    () => subjectsQuery.data?.data.find((s) => s.id === assignmentQuery.data?.subjectId),
    [subjectsQuery.data, assignmentQuery.data],
  )
  const section = useMemo(
    () => sectionsQuery.data?.data.find((s) => s.id === assignmentQuery.data?.sectionId),
    [sectionsQuery.data, assignmentQuery.data],
  )
  const studentById = useMemo(
    () => new Map((studentsQuery.data?.data ?? []).map((s) => [s.id, s])),
    [studentsQuery.data],
  )

  if (assignmentQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (assignmentQuery.isError || !assignmentQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Assignment not found.</Typography.Text>
      </Card>
    )
  }

  const assignment = assignmentQuery.data

  async function handleDelete() {
    await deleteAssignment
      .mutateAsync(assignment.id, { onSuccess: () => navigate('/assignments') })
      .catch(() => message.error('Failed to delete assignment'))
  }

  function openEvaluate(submission: AssignmentSubmission) {
    setEvaluatingSubmission(submission)
    setMarksObtained(submission.marksObtained)
    setFeedback(submission.feedback ?? '')
  }

  async function submitEvaluation() {
    if (!evaluatingSubmission || marksObtained === null) return
    await evaluateSubmission
      .mutateAsync({
        submissionId: evaluatingSubmission.id,
        input: { marksObtained, feedback: feedback || undefined },
      })
      .then(() => setEvaluatingSubmission(undefined))
      .catch(() => undefined)
  }

  const submissionColumns: TableProps<AssignmentSubmission>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => {
        const student = studentById.get(value)
        return student ? `${student.firstName} ${student.lastName} (${student.rollNumber})` : value
      },
    },
    {
      title: 'Submitted at',
      dataIndex: 'submittedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: AssignmentSubmissionStatus) => <Tag color={SUBMISSION_STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Marks',
      dataIndex: 'marksObtained',
      width: 120,
      render: (value: number | null) => (value === null ? '—' : `${value} / ${assignment.maxMarks}`),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status !== 'EVALUATED' ? (
          <Button size="small" onClick={() => openEvaluate(record)}>
            Evaluate
          </Button>
        ) : (
          <Button size="small" onClick={() => openEvaluate(record)}>
            Re-evaluate
          </Button>
        ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Assignment details
        </Typography.Title>
        <Space>
          {assignment.status === 'DRAFT' && (
            <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>
              Edit
            </Button>
          )}
          {assignment.status === 'DRAFT' && (
            <Popconfirm
              title="Publish assignment"
              description="Students will be able to submit once published. Continue?"
              onConfirm={() => publishAssignment.mutateAsync(assignment.id).catch(() => undefined)}
              okText="Publish"
            >
              <Button type="primary" ghost>
                Publish
              </Button>
            </Popconfirm>
          )}
          {assignment.status === 'PUBLISHED' && (
            <Popconfirm
              title="Close assignment"
              description="No further submissions will be accepted. Continue?"
              onConfirm={() => closeAssignment.mutateAsync(assignment.id).catch(() => undefined)}
              okText="Close"
            >
              <Button>Close</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete assignment"
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
        <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {assignment.title}
            </Typography.Title>
            <Tag color={STATUS_COLOR[assignment.status]}>{assignment.status}</Tag>
          </div>
        </Flex>

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Subject">{subject ? `${subject.name} (${subject.code})` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Section">{section?.name ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Start date">{new Date(assignment.startDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Due date">{new Date(assignment.dueDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Max marks" span={2}>
            {assignment.maxMarks}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {assignment.description || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Submissions" style={{ marginTop: 16 }}>
        <Table<AssignmentSubmission>
          rowKey="id"
          columns={submissionColumns}
          dataSource={submissionsQuery.data?.data}
          loading={submissionsQuery.isFetching}
          pagination={false}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/assignments">&larr; Back to assignments</Link>
      </div>

      <AssignmentFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} assignment={assignment} />

      <Modal
        title="Evaluate submission"
        open={!!evaluatingSubmission}
        onCancel={() => setEvaluatingSubmission(undefined)}
        onOk={submitEvaluation}
        confirmLoading={evaluateSubmission.isPending}
        okText="Save evaluation"
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label={`Marks obtained (out of ${assignment.maxMarks})`} required>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={assignment.maxMarks}
              value={marksObtained ?? undefined}
              onChange={(value) => setMarksObtained(value)}
            />
          </Form.Item>
          <Form.Item label="Feedback">
            <Input.TextArea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
