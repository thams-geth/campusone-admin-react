import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { App, Button, Card, Descriptions, Flex, Input, Modal, Select, Skeleton, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { AttendanceStatus } from '@/services/api/attendanceApi'
import { useAuth } from '@/features/auth/useAuth'
import {
  useAllSectionsForAttendance,
  useAllSubjectsForAttendance,
  useAttendanceSessionQuery,
  useLockAttendanceSession,
  useMarkAttendanceRecords,
  useRequestAttendanceCorrection,
  useSectionRoster,
  useSubmitAttendanceSession,
} from '@/features/attendance/hooks'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'EXCUSED', label: 'Excused' },
  { value: 'ON_LEAVE', label: 'On leave' },
]

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  PRESENT: 'success',
  ABSENT: 'error',
  LATE: 'warning',
  EXCUSED: 'blue',
  ON_LEAVE: 'default',
}

const SESSION_STATUS_COLOR: Record<string, string> = { DRAFT: 'default', SUBMITTED: 'blue', LOCKED: 'green' }

const MANAGE_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'HOD', 'FACULTY'] as const

interface RosterRow {
  studentId: string
  recordId?: string
  firstName: string
  lastName: string
  rollNumber: string
  status: AttendanceStatus
}

function readStudentField(student: Record<string, unknown> | undefined, field: string): string {
  const value = student?.[field]
  return typeof value === 'string' ? value : ''
}

export function AttendanceSessionPage() {
  const { id } = useParams<{ id: string }>()
  const { message } = App.useApp()
  const { hasRole } = useAuth()
  const canManage = hasRole(...MANAGE_ROLES)

  const sessionQuery = useAttendanceSessionQuery(id)
  const session = sessionQuery.data
  const hasRecords = !!session?.records && session.records.length > 0

  const rosterQuery = useSectionRoster(session && !hasRecords ? session.sectionId : undefined)
  const sectionsQuery = useAllSectionsForAttendance()
  const subjectsQuery = useAllSubjectsForAttendance()

  const markRecords = useMarkAttendanceRecords()
  const submitSession = useSubmitAttendanceSession()
  const lockSession = useLockAttendanceSession()
  const requestCorrection = useRequestAttendanceCorrection()

  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({})
  const [correctionTarget, setCorrectionTarget] = useState<{ recordId: string; label: string } | undefined>(undefined)
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('PRESENT')
  const [correctionReason, setCorrectionReason] = useState('')

  // statusByStudent only holds the user's in-progress edits (sparse) —
  // rosterRows below falls back to the record's/roster's own status for
  // any student not yet touched, so there's no need to pre-populate it
  // from query data via an effect. Left unmemoized deliberately — the
  // React Compiler auto-memoizes this; a manual useMemo here disagreed
  // with its inferred dependencies (session.records vs. session?.records)
  // and got skipped instead.
  const records = session?.records
  const rosterRows: RosterRow[] =
    hasRecords && records
      ? records.map((record) => ({
          studentId: record.studentId,
          recordId: record.id,
          firstName: readStudentField(record.student, 'firstName'),
          lastName: readStudentField(record.student, 'lastName'),
          rollNumber: readStudentField(record.student, 'rollNumber') || '—',
          status: statusByStudent[record.studentId] ?? record.status,
        }))
      : (rosterQuery.data ?? []).map((student) => ({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          rollNumber: student.rollNumber,
          status: statusByStudent[student.id] ?? 'PRESENT',
        }))

  if (sessionQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (sessionQuery.isError || !session) {
    return (
      <Card>
        <Typography.Text type="danger">Attendance session not found.</Typography.Text>
      </Card>
    )
  }

  const isLocked = session.status === 'LOCKED'
  const canEditRecords = !isLocked
  const section = sectionsQuery.data?.data.find((s) => s.id === session.sectionId)
  const subject = subjectsQuery.data?.data.find((s) => s.id === session.subjectId)

  function handleSave() {
    if (!session) return
    const records = rosterRows.map((row) => ({ studentId: row.studentId, status: statusByStudent[row.studentId] ?? row.status }))
    markRecords.mutate({ sessionId: session.id, input: { records } })
  }

  function openCorrectionModal(row: RosterRow) {
    if (!row.recordId) return
    setCorrectionTarget({ recordId: row.recordId, label: `${row.firstName} ${row.lastName}`.trim() || row.rollNumber })
    setCorrectionStatus(row.status)
    setCorrectionReason('')
  }

  async function submitCorrection() {
    if (!correctionTarget) return
    if (correctionReason.trim().length < 3) {
      message.error('Reason must be at least 3 characters')
      return
    }
    await requestCorrection
      .mutateAsync({ recordId: correctionTarget.recordId, input: { requestedStatus: correctionStatus, reason: correctionReason.trim() } })
      .then(() => setCorrectionTarget(undefined))
      .catch(() => undefined)
  }

  const columns: TableProps<RosterRow>['columns'] = [
    {
      title: 'Student',
      key: 'name',
      render: (_, row) => (
        <div>
          <Typography.Text strong>
            {row.firstName} {row.lastName}
          </Typography.Text>
        </div>
      ),
    },
    { title: 'Roll number', dataIndex: 'rollNumber', width: 140 },
    {
      title: 'Status',
      key: 'status',
      width: 200,
      render: (_, row) =>
        canEditRecords ? (
          <Select<AttendanceStatus>
            value={statusByStudent[row.studentId] ?? row.status}
            style={{ width: 160 }}
            options={STATUS_OPTIONS}
            onChange={(value) => setStatusByStudent((prev) => ({ ...prev, [row.studentId]: value }))}
          />
        ) : (
          <Tag color={STATUS_COLOR[row.status]}>{row.status}</Tag>
        ),
    },
    ...(isLocked
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 160,
            render: (_: unknown, row: RosterRow) => (
              <Button size="small" disabled={!row.recordId} onClick={() => openCorrectionModal(row)}>
                Request correction
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Attendance session
        </Typography.Title>
        <Tag color={SESSION_STATUS_COLOR[session.status]}>{session.status}</Tag>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Date">{new Date(session.date).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Status">{session.status}</Descriptions.Item>
          <Descriptions.Item label="Section">{section?.name ?? session.sectionId}</Descriptions.Item>
          <Descriptions.Item label="Subject">{subject ? `${subject.code} — ${subject.name}` : session.subjectId}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Roster"
        extra={
          canManage && (
            <Space>
              {canEditRecords && (
                <Button type="primary" loading={markRecords.isPending} onClick={handleSave}>
                  Save attendance
                </Button>
              )}
              {session.status === 'DRAFT' && (
                <Button loading={submitSession.isPending} onClick={() => submitSession.mutate(session.id)}>
                  Submit
                </Button>
              )}
              {session.status === 'SUBMITTED' && (
                <Button loading={lockSession.isPending} onClick={() => lockSession.mutate(session.id)}>
                  Lock
                </Button>
              )}
            </Space>
          )
        }
      >
        <Table<RosterRow>
          rowKey="studentId"
          columns={columns}
          dataSource={rosterRows}
          loading={!hasRecords && rosterQuery.isPending}
          pagination={false}
          locale={{ emptyText: 'No students found for this section.' }}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/attendance">&larr; Back to attendance sessions</Link>
      </div>

      <Modal
        title={`Request correction${correctionTarget ? ` — ${correctionTarget.label}` : ''}`}
        open={!!correctionTarget}
        onCancel={() => setCorrectionTarget(undefined)}
        onOk={submitCorrection}
        confirmLoading={requestCorrection.isPending}
        okText="Submit request"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text>Requested status</Typography.Text>
            <Select<AttendanceStatus>
              value={correctionStatus}
              style={{ width: '100%', marginTop: 4 }}
              options={STATUS_OPTIONS}
              onChange={setCorrectionStatus}
            />
          </div>
          <div>
            <Typography.Text>Reason</Typography.Text>
            <Input.TextArea
              rows={3}
              style={{ marginTop: 4 }}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Why should this record change?"
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
