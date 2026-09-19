import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Flex,
  InputNumber,
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
import type { ExamSchedule, ExamStatus, ExamType } from '@/services/api/examinationsApi'
import {
  useAllRooms,
  useAllStudentsForMarks,
  useAllSubjects,
  useCgpaQuery,
  useDeleteExamSchedule,
  useExamQuery,
  useExamSchedulesQuery,
  useSemesterResultQuery,
} from '@/features/examinations/hooks'
import { ExamScheduleFormDrawer } from '@/features/examinations/ExamScheduleFormDrawer'

const EXAM_TYPE_COLOR: Record<ExamType, string> = {
  INTERNAL: 'default',
  MIDTERM: 'blue',
  FINAL: 'red',
  SUPPLEMENTARY: 'orange',
}

const EXAM_STATUS_COLOR: Record<ExamStatus, string> = {
  SCHEDULED: 'default',
  ONGOING: 'processing',
  COMPLETED: 'success',
}

export function ExamDetailsPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const examQuery = useExamQuery(examId)
  const schedulesFallbackQuery = useExamSchedulesQuery(examQuery.data?.schedules ? undefined : examId)
  const subjectsQuery = useAllSubjects()
  const roomsQuery = useAllRooms()
  const deleteSchedule = useDeleteExamSchedule()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | undefined>(undefined)

  const schedules = examQuery.data?.schedules ?? schedulesFallbackQuery.data ?? []

  const subjectLabel = useCallback(
    (id: string) => {
      const subject = subjectsQuery.data?.data.find((s) => s.id === id)
      return subject ? `${subject.code} — ${subject.name}` : id
    },
    [subjectsQuery.data],
  )

  const roomLabel = useCallback(
    (id: string) => roomsQuery.data?.data.find((r) => r.id === id)?.name ?? id,
    [roomsQuery.data],
  )

  const handleDeleteSchedule = useCallback(
    (schedule: ExamSchedule) =>
      deleteSchedule.mutateAsync({ id: schedule.id, examId: examId as string }).catch(() => undefined),
    [deleteSchedule, examId],
  )

  const columns: TableProps<ExamSchedule>['columns'] = [
    {
      title: 'Subject',
      dataIndex: 'subjectId',
      render: (value: string) => subjectLabel(value),
    },
    {
      title: 'Date',
      dataIndex: 'examDate',
      width: 130,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Time',
      key: 'time',
      width: 140,
      render: (_, record) => `${record.startTime} – ${record.endTime}`,
    },
    {
      title: 'Room',
      dataIndex: 'roomId',
      width: 160,
      render: (value: string) => roomLabel(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Link to={`/examinations/schedules/${record.id}`} state={{ examId }}>
            <Button size="small" type="primary">
              Marks
            </Button>
          </Link>
          <Button
            size="small"
            onClick={() => {
              setEditingSchedule(record)
              setDrawerOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Remove schedule"
            description="Only possible if no marks have been entered yet."
            onConfirm={() => handleDeleteSchedule(record)}
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

  if (examQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (examQuery.isError || !examQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Exam not found.</Typography.Text>
      </Card>
    )
  }

  const exam = examQuery.data

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {exam.name}
        </Typography.Title>
        <Space>
          <Tag color={EXAM_TYPE_COLOR[exam.examType]}>{exam.examType}</Tag>
          <Tag color={EXAM_STATUS_COLOR[exam.status]}>{exam.status}</Tag>
        </Space>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Semester">{exam.semesterNumber}</Descriptions.Item>
          <Descriptions.Item label="Status">{exam.status}</Descriptions.Item>
          <Descriptions.Item label="Start date">{new Date(exam.startDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="End date">{new Date(exam.endDate).toLocaleDateString()}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Schedules"
        style={{ marginBottom: 16 }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSchedule(undefined)
              setDrawerOpen(true)
            }}
          >
            Add schedule
          </Button>
        }
      >
        <Table<ExamSchedule>
          rowKey="id"
          columns={columns}
          dataSource={schedules}
          loading={schedulesFallbackQuery.isFetching}
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/examinations/schedules/${record.id}`, { state: { examId } }),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <ResultsLookupCard defaultSemesterNumber={exam.semesterNumber} />

      <div style={{ marginTop: 16 }}>
        <Link to="/examinations">&larr; Back to examinations</Link>
      </div>

      {examId && (
        <ExamScheduleFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          examId={examId}
          schedule={editingSchedule}
        />
      )}
    </div>
  )
}

/** Nice-to-have: subject-by-subject semester result + CGPA lookup for a given student. */
function ResultsLookupCard({ defaultSemesterNumber }: { defaultSemesterNumber: number }) {
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [semesterNumber, setSemesterNumber] = useState<number>(defaultSemesterNumber)

  const studentsQuery = useAllStudentsForMarks()
  const semesterResultQuery = useSemesterResultQuery(semesterNumber, studentId)
  const cgpaQuery = useCgpaQuery(studentId)

  const studentOptions = useMemo(
    () => (studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` })),
    [studentsQuery.data],
  )

  function handleLookup() {
    if (!studentId) return
    void semesterResultQuery.refetch()
    void cgpaQuery.refetch()
  }

  const resultColumns: TableProps<{ subjectId: string; subjectName: string; subjectCode: string; credits: number; marksObtained: number; maxMarks: number; percentage: number; grade: string; gradePoints: number }>['columns'] = [
    { title: 'Subject', dataIndex: 'subjectName', render: (_, r) => `${r.subjectCode} — ${r.subjectName}` },
    { title: 'Credits', dataIndex: 'credits', width: 90 },
    { title: 'Marks', key: 'marks', width: 120, render: (_, r) => `${r.marksObtained} / ${r.maxMarks}` },
    { title: 'Percentage', dataIndex: 'percentage', width: 110, render: (v: number) => `${v.toFixed(1)}%` },
    { title: 'Grade', dataIndex: 'grade', width: 90 },
    { title: 'Grade points', dataIndex: 'gradePoints', width: 110 },
  ]

  return (
    <Card title="Results lookup" style={{ marginBottom: 16 }}>
      <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
        <Select
          showSearch
          loading={studentsQuery.isPending}
          optionFilterProp="label"
          placeholder="Select student"
          style={{ width: 260 }}
          value={studentId}
          onChange={setStudentId}
          options={studentOptions}
        />
        <InputNumber min={1} max={12} value={semesterNumber} onChange={(v) => setSemesterNumber(v ?? 1)} addonBefore="Semester" />
        <Button type="primary" onClick={handleLookup} loading={semesterResultQuery.isFetching || cgpaQuery.isFetching} disabled={!studentId}>
          Look up
        </Button>
      </Flex>

      {semesterResultQuery.data && (
        <>
          <Table
            rowKey="subjectId"
            columns={resultColumns}
            dataSource={semesterResultQuery.data.subjects}
            pagination={false}
            size="small"
            style={{ marginBottom: 12 }}
          />
          <Space size={24}>
            <Typography.Text strong>SGPA: {semesterResultQuery.data.sgpa.toFixed(2)}</Typography.Text>
            {cgpaQuery.data && <Typography.Text strong>CGPA: {cgpaQuery.data.cgpa.toFixed(2)}</Typography.Text>}
          </Space>
        </>
      )}

      {semesterResultQuery.isError && <Typography.Text type="danger">Failed to load results for this student/semester.</Typography.Text>}
    </Card>
  )
}
