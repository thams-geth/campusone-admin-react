import { useMemo, useState } from 'react'
import { Button, Card, Empty, Flex, Popconfirm, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { AllocationStatus, HostelAllocation, HostelRoom } from '@/services/api/hostelApi'
import {
  useAllHostelRooms,
  useAllStudentsForHostel,
  useDeleteHostel,
  useDeleteHostelRoom,
  useHostelAllocationsQuery,
  useHostelRoomsQuery,
  useHostelsQuery,
  useVacateAllocation,
} from '@/features/hostel/hooks'
import { HostelFormDrawer } from '@/features/hostel/HostelFormDrawer'
import { HostelRoomFormDrawer } from '@/features/hostel/HostelRoomFormDrawer'
import { HostelAllocationFormDrawer } from '@/features/hostel/HostelAllocationFormDrawer'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<AllocationStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see the leave/attendance modules' HandbookGotcha note. */
export function HostelRoomsTab() {
  const [selectedHostelId, setSelectedHostelId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [hostelDrawerOpen, setHostelDrawerOpen] = useState(false)
  const [roomDrawerOpen, setRoomDrawerOpen] = useState(false)

  const hostelsQuery = useHostelsQuery()
  const deleteHostel = useDeleteHostel()
  const deleteHostelRoom = useDeleteHostelRoom()

  const hostels = hostelsQuery.data ?? []
  // Default to the first hostel once the list loads, without a
  // setState-in-effect: derive the effective selection instead of storing
  // a value that has to be synced back from `hostels`.
  const effectiveHostelId = selectedHostelId ?? hostels[0]?.id
  const selectedHostel = hostels.find((h) => h.id === effectiveHostelId)

  const roomsQuery = useHostelRoomsQuery({ hostelId: effectiveHostelId, page, pageSize })

  const columns: TableProps<HostelRoom>['columns'] = [
    { title: 'Room number', dataIndex: 'roomNumber' },
    { title: 'Capacity', dataIndex: 'capacity', width: 120, align: 'right' },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Delete room"
          description={`Delete room "${record.roomNumber}"? This cannot be undone.`}
          onConfirm={() => deleteHostelRoom.mutateAsync(record.id).catch(() => undefined)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap gap={12}>
        <Space wrap>
          <Select
            style={{ width: 220 }}
            placeholder="Select hostel"
            loading={hostelsQuery.isPending}
            value={effectiveHostelId}
            onChange={(value) => {
              setSelectedHostelId(value)
              setPage(1)
            }}
            options={hostels.map((h) => ({ value: h.id, label: h.name }))}
          />
          <Button onClick={() => setHostelDrawerOpen(true)}>Add hostel</Button>
          {selectedHostel && (
            <Popconfirm
              title="Delete hostel"
              description={`Delete "${selectedHostel.name}"? This cannot be undone.`}
              onConfirm={() =>
                deleteHostel.mutateAsync(selectedHostel.id, {
                  onSuccess: () => setSelectedHostelId(undefined),
                }).catch(() => undefined)
              }
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button danger>Delete hostel</Button>
            </Popconfirm>
          )}
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!effectiveHostelId}
          onClick={() => setRoomDrawerOpen(true)}
        >
          Add room
        </Button>
      </Flex>

      <Card>
        {effectiveHostelId ? (
          <Table<HostelRoom>
            rowKey="id"
            columns={columns}
            dataSource={roomsQuery.data?.data}
            loading={roomsQuery.isFetching}
            pagination={{
              current: page,
              pageSize,
              total: roomsQuery.data?.meta.total,
              showSizeChanger: true,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage)
                setPageSize(nextPageSize)
              },
            }}
          />
        ) : (
          <Empty description="Add a hostel to get started" />
        )}
      </Card>

      <HostelFormDrawer open={hostelDrawerOpen} onClose={() => setHostelDrawerOpen(false)} />
      <HostelRoomFormDrawer
        open={roomDrawerOpen}
        onClose={() => setRoomDrawerOpen(false)}
        hostels={hostels}
        defaultHostelId={effectiveHostelId}
      />
    </div>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see the module-level gotcha note in HostelPage.tsx. */
export function HostelAllocationsTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [hostelRoomId, setHostelRoomId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<AllocationStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useHostelAllocationsQuery({ page, pageSize, studentId, hostelRoomId, status })
  const studentsQuery = useAllStudentsForHostel()
  const roomsQuery = useAllHostelRooms()
  const vacateAllocation = useVacateAllocation()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, `${s.firstName} ${s.lastName} (${s.rollNumber})`)
    }
    return map
  }, [studentsQuery.data])

  const roomLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roomsQuery.data?.data ?? []) {
      map.set(r.id, r.roomNumber)
    }
    return map
  }, [roomsQuery.data])

  const columns: TableProps<HostelAllocation>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Room',
      dataIndex: 'hostelRoomId',
      render: (value: string) => roomLabelById.get(value) ?? value,
    },
    { title: 'Bed', dataIndex: 'bedNumber', width: 80, align: 'right' },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: AllocationStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    { title: 'Start date', dataIndex: 'startDate', width: 130, render: (value: string) => formatDate(value) },
    { title: 'End date', dataIndex: 'endDate', width: 130, render: (value: string | null) => formatDate(value) },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status === 'ACTIVE' ? (
          <Popconfirm
            title="Vacate allocation"
            description="Mark this allocation as vacated?"
            onConfirm={() => vacateAllocation.mutateAsync(record.id).catch(() => undefined)}
            okText="Vacate"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Vacate
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Allocate student
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
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
            options={(studentsQuery.data?.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
            }))}
          />
          <Select
            allowClear
            showSearch
            placeholder="Room"
            style={{ width: 180 }}
            value={hostelRoomId}
            onChange={(value) => {
              setHostelRoomId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={(roomsQuery.data?.data ?? []).map((r) => ({ value: r.id, label: r.roomNumber }))}
          />
          <Select<AllocationStatus | undefined>
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

        <Table<HostelAllocation>
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

      <HostelAllocationFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rooms={roomsQuery.data?.data ?? []}
      />
    </div>
  )
}

export function HostelPage() {
  const items = [
    { key: 'rooms', label: 'Rooms', children: <HostelRoomsTab /> },
    { key: 'allocations', label: 'Allocations', children: <HostelAllocationsTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Hostel
      </Typography.Title>
      <Tabs defaultActiveKey="rooms" items={items} />
    </div>
  )
}
