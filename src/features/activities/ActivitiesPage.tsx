import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ActivityType, StudentActivity } from '@/services/api/activitiesApi'
import { useActivitiesQuery, useAllStudentsForActivities, useDeleteActivity } from '@/features/activities/hooks'
import { ActivityFormDrawer } from '@/features/activities/ActivityFormDrawer'

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'EVENT', label: 'Event' },
  { value: 'CLUB', label: 'Club' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'OTHER', label: 'Other' },
]

const TYPE_COLOR: Record<ActivityType, string> = {
  ACHIEVEMENT: 'gold',
  EVENT: 'blue',
  CLUB: 'purple',
  SPORTS: 'green',
  COMPETITION: 'volcano',
  INTERNSHIP: 'cyan',
  OTHER: 'default',
}

export function ActivitiesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [type, setType] = useState<ActivityType | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<StudentActivity | undefined>(undefined)

  const query = useActivitiesQuery({ page, pageSize, studentId, type })
  const studentsQuery = useAllStudentsForActivities()
  const deleteActivity = useDeleteActivity()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) map.set(s.id, `${s.firstName} ${s.lastName}`)
    return map
  }, [studentsQuery.data])

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (activity: StudentActivity) => deleteActivity.mutateAsync(activity.id).catch(() => undefined),
    [deleteActivity],
  )

  const columns = useMemo<TableProps<StudentActivity>['columns']>(
    () => [
      {
        title: 'Student',
        dataIndex: 'studentId',
        render: (value: string) => studentNameById.get(value) ?? value,
      },
      {
        title: 'Type',
        dataIndex: 'type',
        width: 130,
        render: (value: ActivityType) => <Tag color={TYPE_COLOR[value]}>{value}</Tag>,
      },
      { title: 'Title', dataIndex: 'title' },
      {
        title: 'Date',
        dataIndex: 'date',
        width: 120,
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        title: 'Certificate',
        dataIndex: 'certificateUrl',
        width: 120,
        render: (value: string | null) =>
          value ? (
            <a href={value} target="_blank" rel="noreferrer">
              View
            </a>
          ) : (
            '—'
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
                setEditingActivity(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete activity"
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
    ],
    [handleDelete, studentNameById],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Activities
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingActivity(undefined)
            setDrawerOpen(true)
          }}
        >
          Add activity
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Student"
            style={{ width: 220 }}
            value={studentId}
            onChange={(value) => {
              setStudentId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={(studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
          />
          <Select<ActivityType | undefined>
            allowClear
            placeholder="Type"
            style={{ width: 160 }}
            value={type}
            onChange={(value) => {
              setType(value)
              setPage(1)
            }}
            options={TYPE_OPTIONS}
          />
        </Flex>

        <Table<StudentActivity>
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

      <ActivityFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} activity={editingActivity} />
    </div>
  )
}
