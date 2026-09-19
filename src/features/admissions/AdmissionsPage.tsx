import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Flex, Select, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { AdmissionApplication, AdmissionStatus } from '@/services/api/admissionsApi'
import { STATUS_COLOR } from '@/features/admissions/admissionStatus'
import { useAdmissionApplicationsQuery, useAllPrograms } from '@/features/admissions/hooks'
import { AdmissionApplicationFormDrawer } from '@/features/admissions/AdmissionApplicationFormDrawer'

const STATUS_OPTIONS: { value: AdmissionStatus; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'DOCUMENT_VERIFICATION', label: 'Document verification' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
]

export function AdmissionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<AdmissionStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useAdmissionApplicationsQuery({ page, pageSize, programId, status })
  const programsQuery = useAllPrograms()

  const programById = useMemo(
    () => new Map((programsQuery.data?.data ?? []).map((p) => [p.id, p])),
    [programsQuery.data],
  )

  const columns: TableProps<AdmissionApplication>['columns'] = [
    {
      title: 'Applicant',
      key: 'name',
      render: (_, record) => (
        <Link to={`/admissions/${record.id}`}>
          <Typography.Text strong>
            {record.firstName} {record.lastName}
          </Typography.Text>
        </Link>
      ),
    },
    {
      title: 'Program',
      dataIndex: 'programId',
      render: (value: string) => programById.get(value)?.name ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 190,
      render: (value: AdmissionStatus) => <Tag color={STATUS_COLOR[value]}>{value.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: 160,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Admissions
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          New application
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Program"
            style={{ width: 220 }}
            value={programId}
            loading={programsQuery.isPending}
            onChange={(value) => {
              setProgramId(value)
              setPage(1)
            }}
            options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select<AdmissionStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 200 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />
        </Flex>

        <Table<AdmissionApplication>
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

      <AdmissionApplicationFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
