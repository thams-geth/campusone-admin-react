import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Room, RoomStatus } from '@/services/api/roomsApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { useDeleteRoom, useRoomsQuery } from '@/features/rooms/hooks'
import { RoomFormDrawer } from '@/features/rooms/RoomFormDrawer'

export function RoomsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<RoomStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined)

  const query = useRoomsQuery({ page, pageSize, status })
  const deleteRoom = useDeleteRoom()

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (room: Room) => deleteRoom.mutateAsync(room.id).catch(() => undefined),
    [deleteRoom],
  )

  const columns = useMemo<TableProps<Room>['columns']>(
    () => [
      { title: 'Name', dataIndex: 'name', render: (value: string) => <Typography.Text strong>{value}</Typography.Text> },
      { title: 'Code', dataIndex: 'code', width: 120 },
      {
        title: 'Capacity',
        dataIndex: 'capacity',
        width: 110,
        align: 'right',
        render: (value: number | null) => value ?? '—',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: RoomStatus) => <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>{value}</Tag>,
      },
      ...(canManage
        ? ([
            {
              title: 'Actions',
              key: 'actions',
              width: 160,
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingRoom(record)
                      setDrawerOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete room"
                    description={`Delete "${record.name}"? This cannot be undone.`}
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
          ] satisfies TableProps<Room>['columns'])
        : []),
    ],
    [canManage, handleDelete],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Rooms
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRoom(undefined)
              setDrawerOpen(true)
            }}
          >
            Add room
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
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

        <Table<Room>
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

      {canManage && <RoomFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} room={editingRoom} />}
    </div>
  )
}
