import { useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '@/services/api/leaveApi'
import { useAuth } from '@/features/auth/useAuth'
import {
  useAllStudentsForLeave,
  useApproveLeaveRequest,
  useDeleteLeaveType,
  useLeaveRequestsQuery,
  useLeaveTypesQuery,
  useRejectLeaveRequest,
} from '@/features/leave/hooks'
import { LeaveRequestFormDrawer } from '@/features/leave/LeaveRequestFormDrawer'
import { LeaveTypeFormDrawer } from '@/features/leave/LeaveTypeFormDrawer'
import { formatDate, formatDateTime } from '@/utils/formatDate'

const STATUS_COLOR: Record<LeaveRequestStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'success',
  REJECTED: 'error',
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see LeavePage.test.tsx. */
export function LeaveRequestsTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<LeaveRequestStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useLeaveRequestsQuery({ page, pageSize, status })
  const studentsQuery = useAllStudentsForLeave()
  const leaveTypesQuery = useLeaveTypesQuery()
  const approveLeaveRequest = useApproveLeaveRequest()
  const rejectLeaveRequest = useRejectLeaveRequest()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, `${s.firstName} ${s.lastName}`)
    }
    return map
  }, [studentsQuery.data])

  const leaveTypeNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of leaveTypesQuery.data?.data ?? []) {
      map.set(t.id, t.name)
    }
    return map
  }, [leaveTypesQuery.data])

  const columns: TableProps<LeaveRequest>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Leave type',
      dataIndex: 'leaveTypeId',
      render: (value: string) => leaveTypeNameById.get(value) ?? value,
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => `${formatDate(record.startDate)} – ${formatDate(record.endDate)}`,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      render: (value: string) => (value.length > 60 ? `${value.slice(0, 60)}…` : value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: LeaveRequestStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Reviewed at',
      dataIndex: 'reviewedAt',
      width: 170,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        record.status === 'PENDING' ? (
          <Space>
            <Popconfirm
              title="Approve leave request"
              description="This will mark the student's attendance for these dates as ON_LEAVE."
              onConfirm={() => approveLeaveRequest.mutate(record.id)}
              okText="Approve"
            >
              <Button size="small" type="primary">
                Approve
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Reject leave request"
              onConfirm={() => rejectLeaveRequest.mutate(record.id)}
              okText="Reject"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>
                Reject
              </Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          New request
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<LeaveRequestStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </Flex>

        <Table<LeaveRequest>
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

      <LeaveRequestFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

function LeaveTypesTab() {
  const query = useLeaveTypesQuery()
  const deleteLeaveType = useDeleteLeaveType()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | undefined>(undefined)

  const columns: TableProps<LeaveType>['columns'] = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Default days / year', dataIndex: 'defaultDaysPerYear', width: 180, align: 'right' },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingLeaveType(record)
              setDrawerOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete leave type"
            description={`Delete "${record.name}"? This cannot be undone.`}
            onConfirm={() => deleteLeaveType.mutateAsync(record.id).catch(() => undefined)}
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
        <div />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingLeaveType(undefined)
            setDrawerOpen(true)
          }}
        >
          Add leave type
        </Button>
      </Flex>

      <Card>
        <Table<LeaveType>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={false}
        />
      </Card>

      <LeaveTypeFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} leaveType={editingLeaveType} />
    </div>
  )
}

export function LeavePage() {
  const { hasRole } = useAuth()
  const canManageLeaveTypes = hasRole('SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'HOD')

  const items = [
    { key: 'requests', label: 'Requests', children: <LeaveRequestsTab /> },
    ...(canManageLeaveTypes
      ? [{ key: 'types', label: 'Leave types', children: <LeaveTypesTab /> }]
      : []),
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Leave
      </Typography.Title>
      <Tabs defaultActiveKey="requests" items={items} />
    </div>
  )
}
