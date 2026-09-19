import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Marks, MarksSpecialStatus, MarksStatus } from '@/services/api/examinationsApi'
import { reviseMarksSchema, type ReviseMarksFormValues } from '@/features/examinations/examSchema'
import {
  useAllStudentsForMarks,
  useEditMarks,
  useEnterMarks,
  useMarksForScheduleQuery,
  usePublishMarks,
  useReviseMarks,
  useSubmitMarks,
  useVerifyMarks,
} from '@/features/examinations/hooks'

const STATUS_COLOR: Record<MarksStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  VERIFIED: 'orange',
  PUBLISHED: 'success',
}

const SPECIAL_STATUS_OPTIONS: { value: MarksSpecialStatus; label: string }[] = [
  { value: 'ABSENT', label: 'Absent' },
  { value: 'MALPRACTICE', label: 'Malpractice' },
  { value: 'WITHHELD', label: 'Withheld' },
]

function studentLabel(student: Record<string, unknown> | undefined): string {
  if (!student) return 'Unknown student'
  const firstName = typeof student.firstName === 'string' ? student.firstName : ''
  const lastName = typeof student.lastName === 'string' ? student.lastName : ''
  const rollNumber = typeof student.rollNumber === 'string' ? student.rollNumber : ''
  const name = `${firstName} ${lastName}`.trim() || 'Unknown student'
  return rollNumber ? `${name} (${rollNumber})` : name
}

interface DraftRow {
  key: number
  studentId?: string
  marksObtained?: number
  maxMarks: number
  specialStatus?: MarksSpecialStatus
}

let draftKeySeq = 0

export function ExamScheduleMarksPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const location = useLocation()
  const examIdFromState = (location.state as { examId?: string } | null)?.examId

  const marksQuery = useMarksForScheduleQuery(scheduleId)
  const studentsQuery = useAllStudentsForMarks()

  const submitMarks = useSubmitMarks()
  const verifyMarks = useVerifyMarks()
  const publishMarks = usePublishMarks()
  const enterMarks = useEnterMarks()
  const editMarks = useEditMarks()

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editMarksObtained, setEditMarksObtained] = useState<number | undefined>(undefined)
  const [editSpecialStatus, setEditSpecialStatus] = useState<MarksSpecialStatus | undefined>(undefined)

  const [reviseTarget, setReviseTarget] = useState<Marks | null>(null)

  const [draftRows, setDraftRows] = useState<DraftRow[]>([])

  const marks = useMemo(() => marksQuery.data ?? [], [marksQuery.data])

  const statusCounts = useMemo(() => {
    const counts: Record<MarksStatus, number> = { DRAFT: 0, SUBMITTED: 0, VERIFIED: 0, PUBLISHED: 0 }
    for (const m of marks) counts[m.status]++
    return counts
  }, [marks])

  const existingStudentIds = useMemo(() => new Set(marks.map((m) => m.studentId)), [marks])

  const studentOptions = useMemo(
    () =>
      (studentsQuery.data?.data ?? [])
        .filter((s) => !existingStudentIds.has(s.id))
        .map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` })),
    [studentsQuery.data, existingStudentIds],
  )

  function addDraftRow() {
    setDraftRows((rows) => [...rows, { key: draftKeySeq++, maxMarks: 100 }])
  }

  function removeDraftRow(key: number) {
    setDraftRows((rows) => rows.filter((r) => r.key !== key))
  }

  function updateDraftRow(key: number, patch: Partial<DraftRow>) {
    setDraftRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const validDraftRows = draftRows.filter((r) => r.studentId && r.maxMarks > 0)

  async function handleSaveDraftRows() {
    if (!scheduleId || validDraftRows.length === 0) return
    await enterMarks
      .mutateAsync({
        scheduleId,
        input: {
          marks: validDraftRows.map((r) => ({
            studentId: r.studentId as string,
            marksObtained: r.marksObtained,
            maxMarks: r.maxMarks,
            specialStatus: r.specialStatus,
          })),
        },
      })
      .then(() => setDraftRows([]))
      .catch(() => undefined)
  }

  function startEdit(mark: Marks) {
    setEditingRowId(mark.id)
    setEditMarksObtained(mark.marksObtained ?? undefined)
    setEditSpecialStatus(mark.specialStatus ?? undefined)
  }

  function cancelEdit() {
    setEditingRowId(null)
  }

  async function saveEdit(mark: Marks) {
    if (!scheduleId) return
    await editMarks
      .mutateAsync({
        id: mark.id,
        scheduleId,
        input: { marksObtained: editMarksObtained, specialStatus: editSpecialStatus },
      })
      .then(() => setEditingRowId(null))
      .catch(() => undefined)
  }

  const columns: TableProps<Marks>['columns'] = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => studentLabel(record.student),
    },
    {
      title: 'Marks obtained',
      key: 'marksObtained',
      width: 160,
      render: (_, record) =>
        editingRowId === record.id ? (
          <InputNumber min={0} value={editMarksObtained} onChange={(v) => setEditMarksObtained(v ?? undefined)} />
        ) : (
          (record.marksObtained ?? '—')
        ),
    },
    {
      title: 'Max marks',
      dataIndex: 'maxMarks',
      width: 110,
    },
    {
      title: 'Special status',
      key: 'specialStatus',
      width: 170,
      render: (_, record) =>
        editingRowId === record.id ? (
          <Select
            allowClear
            style={{ width: 150 }}
            placeholder="None"
            value={editSpecialStatus}
            onChange={(v) => setEditSpecialStatus(v)}
            options={SPECIAL_STATUS_OPTIONS}
          />
        ) : (
          record.specialStatus ?? '—'
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: MarksStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 190,
      render: (_, record) => {
        if (editingRowId === record.id) {
          return (
            <Space>
              <Button size="small" type="primary" loading={editMarks.isPending} onClick={() => saveEdit(record)}>
                Save
              </Button>
              <Button size="small" onClick={cancelEdit}>
                Cancel
              </Button>
            </Space>
          )
        }
        if (record.status === 'DRAFT' || record.status === 'SUBMITTED') {
          return (
            <Button size="small" onClick={() => startEdit(record)}>
              Edit
            </Button>
          )
        }
        if (record.status === 'PUBLISHED') {
          return (
            <Button size="small" onClick={() => setReviseTarget(record)}>
              Revise
            </Button>
          )
        }
        return null
      },
    },
  ]

  if (!scheduleId) return null

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Schedule marks
        </Typography.Title>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Space wrap>
            <Typography.Text strong>Status:</Typography.Text>
            {marks.length === 0 && <Tag>No marks entered yet</Tag>}
            {(Object.keys(statusCounts) as MarksStatus[])
              .filter((status) => statusCounts[status] > 0)
              .map((status) => (
                <Tag key={status} color={STATUS_COLOR[status]}>
                  {status}: {statusCounts[status]}
                </Tag>
              ))}
          </Space>
          <Space>
            <Popconfirm
              title="Submit marks"
              description={`Submit ${statusCounts.DRAFT} DRAFT mark(s) for review?`}
              onConfirm={() => submitMarks.mutate(scheduleId)}
              disabled={statusCounts.DRAFT === 0}
            >
              <Button disabled={statusCounts.DRAFT === 0} loading={submitMarks.isPending}>
                Submit
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Verify marks"
              description={`Verify ${statusCounts.SUBMITTED} SUBMITTED mark(s)?`}
              onConfirm={() => verifyMarks.mutate(scheduleId)}
              disabled={statusCounts.SUBMITTED === 0}
            >
              <Button disabled={statusCounts.SUBMITTED === 0} loading={verifyMarks.isPending}>
                Verify
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Publish marks"
              description={`Publish ${statusCounts.VERIFIED} VERIFIED mark(s)? Students will be able to see them.`}
              onConfirm={() => publishMarks.mutate(scheduleId)}
              disabled={statusCounts.VERIFIED === 0}
            >
              <Button type="primary" disabled={statusCounts.VERIFIED === 0} loading={publishMarks.isPending}>
                Publish
              </Button>
            </Popconfirm>
          </Space>
        </Flex>
      </Card>

      <Card title="Roster" style={{ marginBottom: 16 }}>
        {marksQuery.isPending ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Table<Marks> rowKey="id" columns={columns} dataSource={marks} pagination={false} />
        )}
      </Card>

      <Card
        title="Add students"
        extra={
          <Button icon={<PlusOutlined />} onClick={addDraftRow}>
            Add row
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No automatic class roster"
          description="An exam schedule doesn't carry a section, so the roster can't be auto-populated. Add students one at a time below, then save."
        />
        {draftRows.length > 0 && (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {draftRows.map((row) => (
                <Flex key={row.key} gap={8} align="center" wrap>
                  <Select
                    showSearch
                    loading={studentsQuery.isPending}
                    optionFilterProp="label"
                    placeholder="Select student"
                    style={{ width: 260 }}
                    value={row.studentId}
                    onChange={(v) => updateDraftRow(row.key, { studentId: v })}
                    options={studentOptions}
                  />
                  <InputNumber
                    placeholder="Marks obtained"
                    min={0}
                    value={row.marksObtained}
                    onChange={(v) => updateDraftRow(row.key, { marksObtained: v ?? undefined })}
                  />
                  <InputNumber
                    placeholder="Max marks"
                    min={1}
                    value={row.maxMarks}
                    onChange={(v) => updateDraftRow(row.key, { maxMarks: v ?? 100 })}
                    addonBefore="/"
                  />
                  <Select
                    allowClear
                    style={{ width: 150 }}
                    placeholder="Special status"
                    value={row.specialStatus}
                    onChange={(v) => updateDraftRow(row.key, { specialStatus: v })}
                    options={SPECIAL_STATUS_OPTIONS}
                  />
                  <Button danger onClick={() => removeDraftRow(row.key)}>
                    Remove
                  </Button>
                </Flex>
              ))}
            </Space>
            <Button
              type="primary"
              style={{ marginTop: 16 }}
              loading={enterMarks.isPending}
              disabled={validDraftRows.length === 0}
              onClick={handleSaveDraftRows}
            >
              Save marks
            </Button>
          </>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to={examIdFromState ? `/examinations/${examIdFromState}` : '/examinations'}>
          &larr; {examIdFromState ? 'Back to exam' : 'Back to examinations'}
        </Link>
      </div>

      <ReviseMarksModal mark={reviseTarget} scheduleId={scheduleId} onClose={() => setReviseTarget(null)} />
    </div>
  )
}

function ReviseMarksModal({
  mark,
  scheduleId,
  onClose,
}: {
  mark: Marks | null
  scheduleId: string
  onClose: () => void
}) {
  const reviseMarks = useReviseMarks()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviseMarksFormValues>({
    resolver: zodResolver(reviseMarksSchema),
    defaultValues: { marksObtained: 0, reason: '' },
    values: mark ? { marksObtained: mark.marksObtained ?? 0, reason: '' } : undefined,
  })

  async function onSubmit(values: ReviseMarksFormValues) {
    if (!mark) return
    await reviseMarks
      .mutateAsync({ id: mark.id, scheduleId, input: values })
      .then(() => {
        reset()
        onClose()
      })
      .catch(() => undefined)
  }

  return (
    <Modal
      title="Revise published marks"
      open={!!mark}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={reviseMarks.isPending}
      okText="Revise"
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        These marks have already been published. Revising them is audited and requires a reason.
      </Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item
          label="New marks obtained"
          validateStatus={errors.marksObtained ? 'error' : ''}
          help={errors.marksObtained?.message}
        >
          <Controller
            name="marksObtained"
            control={control}
            render={({ field }) => <InputNumber {...field} min={0} style={{ width: '100%' }} />}
          />
        </Form.Item>
        <Form.Item label="Reason" validateStatus={errors.reason ? 'error' : ''} help={errors.reason?.message}>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Why is this being revised?" />}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
