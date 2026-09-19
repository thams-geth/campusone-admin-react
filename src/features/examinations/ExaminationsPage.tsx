import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Exam, ExamStatus, ExamType } from '@/services/api/examinationsApi'
import { useAllAcademicYears, useDeleteExam, useExamsQuery } from '@/features/examinations/hooks'
import { ExamFormDrawer } from '@/features/examinations/ExamFormDrawer'

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

export function ExaminationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<ExamStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined)

  const query = useExamsQuery({ page, pageSize, status })
  const academicYearsQuery = useAllAcademicYears()
  const deleteExam = useDeleteExam()

  const academicYearName = useCallback(
    (id: string) => academicYearsQuery.data?.data.find((y) => y.id === id)?.name ?? '—',
    [academicYearsQuery.data],
  )

  const handleDelete = useCallback(
    (exam: Exam) => deleteExam.mutateAsync(exam.id).catch(() => undefined),
    [deleteExam],
  )

  const columns: TableProps<Exam>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Type',
      dataIndex: 'examType',
      width: 130,
      render: (value: ExamType) => <Tag color={EXAM_TYPE_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Academic year',
      dataIndex: 'academicYearId',
      width: 150,
      render: (value: string) => academicYearName(value),
    },
    {
      title: 'Semester',
      dataIndex: 'semesterNumber',
      width: 100,
    },
    {
      title: 'Dates',
      key: 'dates',
      width: 220,
      render: (_, record) => `${new Date(record.startDate).toLocaleDateString()} – ${new Date(record.endDate).toLocaleDateString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: ExamStatus) => <Tag color={EXAM_STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            onClick={() => {
              setEditingExam(record)
              setDrawerOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete exam"
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
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Examinations
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingExam(undefined)
            setDrawerOpen(true)
          }}
        >
          Add exam
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<ExamStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 180 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
        </Flex>

        <Table<Exam>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          onRow={(record) => ({
            onClick: () => navigate(`/examinations/${record.id}`),
            style: { cursor: 'pointer' },
          })}
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

      <ExamFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} exam={editingExam} />
    </div>
  )
}
