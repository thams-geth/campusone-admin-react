import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PlacementApplication, PlacementApplicationStatus } from '@/services/api/placementsApi'
import { applicationStatusSchema, type ApplicationStatusFormValues } from '@/features/placements/jobOpeningSchema'
import {
  useAllStudentsForPlacements,
  useApplicationsQuery,
  useCompaniesQuery,
  useJobOpeningQuery,
  useUpdateApplicationStatus,
} from '@/features/placements/hooks'

const STATUS_COLOR: Record<PlacementApplicationStatus, string> = {
  APPLIED: 'blue',
  SHORTLISTED: 'cyan',
  INTERVIEW: 'gold',
  SELECTED: 'success',
  REJECTED: 'error',
}

const STATUS_OPTIONS: { value: ApplicationStatusFormValues['status']; label: string }[] = [
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
]

export function JobOpeningDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [editingApplication, setEditingApplication] = useState<PlacementApplication | undefined>(undefined)

  const jobOpeningQuery = useJobOpeningQuery(id)
  const companiesQuery = useCompaniesQuery()
  const applicationsQuery = useApplicationsQuery({ jobOpeningId: id })
  const studentsQuery = useAllStudentsForPlacements()
  const updateApplicationStatus = useUpdateApplicationStatus()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationStatusFormValues>({
    resolver: zodResolver(applicationStatusSchema),
    defaultValues: { status: 'SHORTLISTED', notes: '', offeredCtc: undefined },
  })

  const company = useMemo(
    () => companiesQuery.data?.find((c) => c.id === jobOpeningQuery.data?.companyId),
    [companiesQuery.data, jobOpeningQuery.data],
  )

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, `${s.firstName} ${s.lastName}`)
    }
    return map
  }, [studentsQuery.data])

  if (jobOpeningQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (jobOpeningQuery.isError || !jobOpeningQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Job opening not found.</Typography.Text>
      </Card>
    )
  }

  const jobOpening = jobOpeningQuery.data

  function openStatusModal(application: PlacementApplication) {
    setEditingApplication(application)
    reset({
      status: (['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'] as const).includes(
        application.status as 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'REJECTED',
      )
        ? (application.status as ApplicationStatusFormValues['status'])
        : 'SHORTLISTED',
      notes: application.notes ?? '',
      offeredCtc: application.offeredCtc ?? undefined,
    })
  }

  function closeStatusModal() {
    setEditingApplication(undefined)
  }

  async function onSubmit(values: ApplicationStatusFormValues) {
    if (!editingApplication) return
    const input = { ...values, notes: values.notes || undefined, offeredCtc: values.offeredCtc ?? undefined }
    // Error surfaces via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await updateApplicationStatus
      .mutateAsync({ id: editingApplication.id, input }, { onSuccess: closeStatusModal })
      .catch(() => undefined)
  }

  const columns: TableProps<PlacementApplication>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (value: PlacementApplicationStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Offered CTC',
      dataIndex: 'offeredCtc',
      width: 120,
      render: (value: number | null) => (value != null ? `${value} LPA` : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Button size="small" onClick={() => openStatusModal(record)}>
          Update status
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Job opening details
      </Typography.Title>

      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {jobOpening.title}
            </Typography.Title>
            <Typography.Text type="secondary">{company?.name ?? '—'}</Typography.Text>
          </div>
        </Flex>

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 3 }} size="small">
          <Descriptions.Item label="Min CGPA">{jobOpening.minCgpa ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="CTC offered">
            {jobOpening.ctcOffered != null ? `${jobOpening.ctcOffered} LPA` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Application deadline">
            {jobOpening.applicationDeadline ? new Date(jobOpening.applicationDeadline).toLocaleDateString() : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={3}>
            {jobOpening.description || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Applications" style={{ marginTop: 16 }}>
        <Table<PlacementApplication>
          rowKey="id"
          columns={columns}
          dataSource={applicationsQuery.data?.data}
          loading={applicationsQuery.isFetching}
          pagination={{ pageSize: applicationsQuery.data?.meta.pageSize ?? 10, total: applicationsQuery.data?.meta.total }}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/placements">&larr; Back to placements</Link>
      </div>

      <Modal
        title="Update application status"
        open={!!editingApplication}
        onCancel={closeStatusModal}
        onOk={handleSubmit(onSubmit)}
        okText="Save"
        confirmLoading={updateApplicationStatus.isPending}
        destroyOnHidden
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <Typography.Text>Status</Typography.Text>
              <Controller
                name="status"
                control={control}
                render={({ field }) => <Select {...field} style={{ width: '100%' }} options={STATUS_OPTIONS} />}
              />
              {errors.status && <Typography.Text type="danger">{errors.status.message}</Typography.Text>}
            </div>

            <div>
              <Typography.Text>Notes</Typography.Text>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => <Input.TextArea {...field} rows={3} />}
              />
            </div>

            <div>
              <Typography.Text>Offered CTC</Typography.Text>
              <Controller
                name="offeredCtc"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} style={{ width: '100%' }} min={0} addonAfter="LPA" />
                )}
              />
            </div>
          </Space>
        </form>
      </Modal>
    </div>
  )
}
