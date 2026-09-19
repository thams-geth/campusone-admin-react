import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Flex, Select, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { AttendanceSession, AttendanceSessionStatus } from '@/services/api/attendanceApi'
import { useAllSectionsForAttendance, useAllSubjectsForAttendance, useAttendanceSessionsQuery } from '@/features/attendance/hooks'
import { AttendanceSessionFormDrawer } from '@/features/attendance/AttendanceSessionFormDrawer'

const STATUS_COLOR: Record<AttendanceSessionStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  LOCKED: 'green',
}

export function AttendancePage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sessionsQuery = useAttendanceSessionsQuery({ page, pageSize, sectionId, subjectId })
  const sectionsQuery = useAllSectionsForAttendance()
  const subjectsQuery = useAllSubjectsForAttendance()

  const sectionById = new Map((sectionsQuery.data?.data ?? []).map((s) => [s.id, s]))
  const subjectById = new Map((subjectsQuery.data?.data ?? []).map((s) => [s.id, s]))

  const columns: TableProps<AttendanceSession>['columns'] = [
    {
      title: 'Date',
      dataIndex: 'date',
      width: 140,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Section',
      dataIndex: 'sectionId',
      render: (value: string) => sectionById.get(value)?.name ?? value,
    },
    {
      title: 'Subject',
      dataIndex: 'subjectId',
      render: (value: string) => {
        const subject = subjectById.get(value)
        return subject ? `${subject.code} — ${subject.name}` : value
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: AttendanceSessionStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Attendance
        </Typography.Title>
        <Flex gap={8}>
          <Button onClick={() => navigate('/attendance/corrections')}>Corrections</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New session
          </Button>
        </Flex>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
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
            options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          />
        </Flex>

        <Table<AttendanceSession>
          rowKey="id"
          columns={columns}
          dataSource={sessionsQuery.data?.data}
          loading={sessionsQuery.isFetching}
          onRow={(record) => ({
            onClick: () => navigate(`/attendance/sessions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total: sessionsQuery.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <AttendanceSessionFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
