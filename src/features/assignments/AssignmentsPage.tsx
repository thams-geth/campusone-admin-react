import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Assignment, AssignmentStatus } from '@/services/api/assignmentsApi'
import {
  useAllSectionsForAssignments,
  useAllSubjectsForAssignments,
  useAssignmentsQuery,
  useCloseAssignment,
  useDeleteAssignment,
  usePublishAssignment,
} from '@/features/assignments/hooks'
import { AssignmentFormDrawer } from '@/features/assignments/AssignmentFormDrawer'

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'blue',
  CLOSED: 'green',
}

const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CLOSED', label: 'Closed' },
]

export function AssignmentsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<AssignmentStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>(undefined)

  const query = useAssignmentsQuery({ page, pageSize, sectionId, subjectId, status })
  const subjectsQuery = useAllSubjectsForAssignments()
  const sectionsQuery = useAllSectionsForAssignments()
  const deleteAssignment = useDeleteAssignment()
  const publishAssignment = usePublishAssignment()
  const closeAssignment = useCloseAssignment()

  const subjectById = useMemo(
    () => new Map((subjectsQuery.data?.data ?? []).map((s) => [s.id, s])),
    [subjectsQuery.data],
  )
  const sectionById = useMemo(
    () => new Map((sectionsQuery.data?.data ?? []).map((s) => [s.id, s])),
    [sectionsQuery.data],
  )

  const handleDelete = useCallback(
    (assignment: Assignment) => deleteAssignment.mutateAsync(assignment.id).catch(() => undefined),
    [deleteAssignment],
  )

  const columns: TableProps<Assignment>['columns'] = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (_, record) => (
        <Link to={`/assignments/${record.id}`}>
          <Typography.Text strong>{record.title}</Typography.Text>
        </Link>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subjectId',
      width: 200,
      render: (value: string) => {
        const subject = subjectById.get(value)
        return subject ? `${subject.name} (${subject.code})` : '—'
      },
    },
    {
      title: 'Section',
      dataIndex: 'sectionId',
      width: 140,
      render: (value: string) => sectionById.get(value)?.name ?? '—',
    },
    {
      title: 'Due date',
      dataIndex: 'dueDate',
      width: 160,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: AssignmentStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space wrap>
          {record.status === 'DRAFT' && (
            <Button
              size="small"
              onClick={() => {
                setEditingAssignment(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Publish assignment"
              description="Students will be able to submit once published. Continue?"
              onConfirm={() => publishAssignment.mutateAsync(record.id).catch(() => undefined)}
              okText="Publish"
            >
              <Button size="small" type="primary" ghost>
                Publish
              </Button>
            </Popconfirm>
          )}
          {record.status === 'PUBLISHED' && (
            <Popconfirm
              title="Close assignment"
              description="No further submissions will be accepted. Continue?"
              onConfirm={() => closeAssignment.mutateAsync(record.id).catch(() => undefined)}
              okText="Close"
            >
              <Button size="small">Close</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete assignment"
            description={`Delete "${record.title}"? This cannot be undone.`}
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

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Assignments
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAssignment(undefined)
            setDrawerOpen(true)
          }}
        >
          Add assignment
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Subject"
            style={{ width: 220 }}
            value={subjectId}
            loading={subjectsQuery.isPending}
            onChange={(value) => {
              setSubjectId(value)
              setPage(1)
            }}
            options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Section"
            style={{ width: 180 }}
            value={sectionId}
            loading={sectionsQuery.isPending}
            onChange={(value) => {
              setSectionId(value)
              setPage(1)
            }}
            options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select<AssignmentStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />
        </Flex>

        <Table<Assignment>
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

      <AssignmentFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} assignment={editingAssignment} />
    </div>
  )
}
