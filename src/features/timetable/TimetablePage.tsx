import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Select, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { TimetableEntry, Weekday } from '@/services/api/timetableApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import {
  useAllFacultyForTimetable,
  useAllRoomsForTimetable,
  useAllSectionsForTimetable,
  useAllSubjectsForTimetable,
  useDeleteTimetableEntry,
  useTimetableEntriesQuery,
} from '@/features/timetable/hooks'
import { TimetableEntryFormDrawer } from '@/features/timetable/TimetableEntryFormDrawer'
import { TimetableGrid } from '@/features/timetable/TimetableGrid'
import { WEEKDAY_OPTIONS } from '@/features/timetable/timetableSchema'

/**
 * Today's filterable flat table, unchanged in behavior — exported so tests
 * can render just this tab's content directly, without antd's `Tabs`
 * wrapper — `Tabs` + a `Popconfirm` inside one of its panes causes a severe
 * jsdom-only slowdown in tests (not a real bug, confirmed fine in real
 * browsers). See FeesPage.tsx/FeesPage.test.tsx or LeavePage.tsx for the
 * same pattern applied there.
 */
export function TimetableListView() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [facultyId, setFacultyId] = useState<string | undefined>(undefined)
  const [roomId, setRoomId] = useState<string | undefined>(undefined)
  const [dayOfWeek, setDayOfWeek] = useState<Weekday | undefined>(undefined)

  const sectionsQuery = useAllSectionsForTimetable()
  const subjectsQuery = useAllSubjectsForTimetable()
  const facultyQuery = useAllFacultyForTimetable()
  const roomsQuery = useAllRoomsForTimetable()
  const query = useTimetableEntriesQuery({ page, pageSize, sectionId, facultyId, roomId, dayOfWeek })
  const deleteEntry = useDeleteTimetableEntry()

  const sectionNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sectionsQuery.data?.data ?? []) map.set(s.id, s.name)
    return map
  }, [sectionsQuery.data])

  const subjectLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of subjectsQuery.data?.data ?? []) map.set(s.id, `${s.code} — ${s.name}`)
    return map
  }, [subjectsQuery.data])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of facultyQuery.data?.data ?? []) map.set(f.id, f.name)
    return map
  }, [facultyQuery.data])

  const roomLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roomsQuery.data?.data ?? []) map.set(r.id, `${r.name} (${r.code})`)
    return map
  }, [roomsQuery.data])

  const handleDelete = useCallback(
    (entry: TimetableEntry) => deleteEntry.mutateAsync(entry.id).catch(() => undefined),
    [deleteEntry],
  )

  const columns = useMemo<TableProps<TimetableEntry>['columns']>(
    () => [
      { title: 'Day', dataIndex: 'dayOfWeek', width: 110, render: (value: Weekday) => <Tag>{value}</Tag> },
      {
        title: 'Time',
        key: 'time',
        width: 130,
        render: (_, record) => `${record.startTime}–${record.endTime}`,
      },
      {
        title: 'Section',
        dataIndex: 'sectionId',
        render: (value: string) => sectionNameById.get(value) ?? value,
      },
      {
        title: 'Subject',
        dataIndex: 'subjectId',
        render: (value: string) => subjectLabelById.get(value) ?? value,
      },
      {
        title: 'Faculty',
        dataIndex: 'facultyId',
        render: (value: string) => facultyNameById.get(value) ?? value,
      },
      {
        title: 'Room',
        dataIndex: 'roomId',
        render: (value: string) => roomLabelById.get(value) ?? value,
      },
      ...(canManage
        ? ([
            {
              title: 'Actions',
              key: 'actions',
              width: 100,
              render: (_, record) => (
                <Popconfirm
                  title="Remove timetable entry"
                  description="Remove this scheduled entry? This cannot be undone."
                  onConfirm={() => handleDelete(record)}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>
                    Remove
                  </Button>
                </Popconfirm>
              ),
            },
          ] satisfies TableProps<TimetableEntry>['columns'])
        : []),
    ],
    [canManage, facultyNameById, handleDelete, roomLabelById, sectionNameById, subjectLabelById],
  )

  return (
    <Card>
      <Flex gap={12} style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Section"
          style={{ width: 200 }}
          value={sectionId}
          loading={sectionsQuery.isPending}
          onChange={(value) => {
            setSectionId(value)
            setPage(1)
          }}
          options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          allowClear
          placeholder="Faculty"
          style={{ width: 200 }}
          value={facultyId}
          loading={facultyQuery.isPending}
          onChange={(value) => {
            setFacultyId(value)
            setPage(1)
          }}
          options={(facultyQuery.data?.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
        />
        <Select
          allowClear
          placeholder="Room"
          style={{ width: 200 }}
          value={roomId}
          loading={roomsQuery.isPending}
          onChange={(value) => {
            setRoomId(value)
            setPage(1)
          }}
          options={(roomsQuery.data?.data ?? []).map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
        />
        <Select
          allowClear
          placeholder="Day of week"
          style={{ width: 160 }}
          value={dayOfWeek}
          onChange={(value) => {
            setDayOfWeek(value)
            setPage(1)
          }}
          options={[...WEEKDAY_OPTIONS]}
        />
      </Flex>

      <Table<TimetableEntry>
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
  )
}

export function TimetablePage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)
  const navigate = useNavigate()

  const [drawerOpen, setDrawerOpen] = useState(false)

  const items = [
    { key: 'grid', label: 'Grid view', children: <TimetableGrid /> },
    { key: 'list', label: 'List view', children: <TimetableListView /> },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Timetable
        </Typography.Title>
        {canManage && (
          <Flex gap={8}>
            <Button onClick={() => navigate('/timetable/periods')}>Configure periods</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Add entry
            </Button>
          </Flex>
        )}
      </Flex>

      <Tabs defaultActiveKey="grid" items={items} />

      {canManage && <TimetableEntryFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
