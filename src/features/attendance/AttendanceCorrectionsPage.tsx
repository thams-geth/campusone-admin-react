import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Flex, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { AttendanceCorrection, CorrectionStatus } from '@/services/api/attendanceApi'
import {
  useApproveAttendanceCorrection,
  useAttendanceCorrectionsQuery,
  useRejectAttendanceCorrection,
} from '@/features/attendance/hooks'

const STATUS_COLOR: Record<CorrectionStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'success',
  REJECTED: 'error',
}

export function AttendanceCorrectionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<CorrectionStatus | undefined>(undefined)

  const correctionsQuery = useAttendanceCorrectionsQuery({ page, pageSize, status })
  const approveCorrection = useApproveAttendanceCorrection()
  const rejectCorrection = useRejectAttendanceCorrection()

  const columns: TableProps<AttendanceCorrection>['columns'] = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => {
        const student = record.record?.student as { firstName?: string; lastName?: string; rollNumber?: string } | undefined
        return student ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.rollNumber : record.recordId
      },
    },
    {
      title: 'Requested status',
      dataIndex: 'requestedStatus',
      width: 150,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: CorrectionStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Requested at',
      dataIndex: 'createdAt',
      width: 160,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        record.status === 'PENDING' ? (
          <Space>
            <Button size="small" type="primary" loading={approveCorrection.isPending} onClick={() => approveCorrection.mutate(record.id)}>
              Approve
            </Button>
            <Button size="small" danger loading={rejectCorrection.isPending} onClick={() => rejectCorrection.mutate(record.id)}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Attendance corrections
        </Typography.Title>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<CorrectionStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 180 }}
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

        <Table<AttendanceCorrection>
          rowKey="id"
          columns={columns}
          dataSource={correctionsQuery.data?.data}
          loading={correctionsQuery.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: correctionsQuery.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/attendance">&larr; Back to attendance sessions</Link>
      </div>
    </div>
  )
}
