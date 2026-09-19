import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { CertificateRequest, CertificateRequestStatus } from '@/services/api/certificatesApi'
import {
  useAllStudentsForCertificates,
  useCertificateRequestsQuery,
  useCertificateTypesQuery,
  useDeleteCertificateType,
  useIssueCertificate,
  useRejectCertificateRequest,
  useVerifyCertificate,
} from '@/features/certificates/hooks'
import { CertificateRequestFormDrawer } from '@/features/certificates/CertificateRequestFormDrawer'
import { CertificateTypeFormDrawer } from '@/features/certificates/CertificateTypeFormDrawer'
import { formatDateTime } from '@/utils/formatDate'

const STATUS_COLOR: Record<CertificateRequestStatus, string> = {
  REQUESTED: 'gold',
  ISSUED: 'success',
  REJECTED: 'error',
}

function RejectModal({
  requestId,
  onClose,
}: {
  requestId: string | undefined
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const rejectCertificateRequest = useRejectCertificateRequest()

  function handleClose() {
    setReason('')
    onClose()
  }

  return (
    <Modal
      title="Reject certificate request"
      open={!!requestId}
      onCancel={handleClose}
      okText="Reject"
      okButtonProps={{ danger: true, disabled: !reason.trim(), loading: rejectCertificateRequest.isPending }}
      onOk={() => {
        if (!requestId || !reason.trim()) return
        rejectCertificateRequest
          .mutateAsync({ id: requestId, input: { rejectionReason: reason.trim() } }, { onSuccess: handleClose })
          .catch(() => undefined)
      }}
    >
      <Typography.Paragraph>Reason for rejection is required.</Typography.Paragraph>
      <Input.TextArea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Outstanding library fine"
      />
    </Modal>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see CertificatesPage.test.tsx. */
export function CertificateRequestsTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<CertificateRequestStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | undefined>(undefined)
  const [verifyCode, setVerifyCode] = useState('')

  const query = useCertificateRequestsQuery({ page, pageSize, studentId, status })
  const studentsQuery = useAllStudentsForCertificates()
  const certificateTypesQuery = useCertificateTypesQuery()
  const issueCertificate = useIssueCertificate()
  const verifyCertificate = useVerifyCertificate()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) map.set(s.id, `${s.firstName} ${s.lastName}`)
    return map
  }, [studentsQuery.data])

  const certificateTypeNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of certificateTypesQuery.data ?? []) map.set(t.id, t.name)
    return map
  }, [certificateTypesQuery.data])

  const columns: TableProps<CertificateRequest>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Certificate type',
      dataIndex: 'certificateTypeId',
      render: (value: string) => certificateTypeNameById.get(value) ?? value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: CertificateRequestStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    { title: 'Issued at', dataIndex: 'issuedAt', width: 180, render: formatDateTime },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) =>
        record.status === 'REQUESTED' ? (
          <Space>
            <Popconfirm
              title="Issue certificate"
              description="Issue this certificate to the student?"
              onConfirm={() => issueCertificate.mutateAsync(record.id).catch(() => undefined)}
              okText="Issue"
            >
              <Button size="small" type="primary">
                Issue
              </Button>
            </Popconfirm>
            <Button size="small" danger onClick={() => setRejectingId(record.id)}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          New request
        </Button>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Text strong>Verify a certificate</Typography.Text>
        <Flex gap={12} style={{ marginTop: 8 }} wrap>
          <Input
            allowClear
            placeholder="Verification code"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 260 }}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
          />
          <Button
            loading={verifyCertificate.isPending}
            disabled={!verifyCode.trim()}
            onClick={() => verifyCertificate.mutate(verifyCode.trim())}
          >
            Verify
          </Button>
        </Flex>
        {verifyCertificate.data && (
          <div style={{ marginTop: 12 }}>
            {verifyCertificate.data.valid ? (
              <Descriptions size="small" bordered column={1}>
                <Descriptions.Item label="Certificate type">
                  {verifyCertificate.data.certificateType}
                </Descriptions.Item>
                <Descriptions.Item label="Student">{verifyCertificate.data.studentName}</Descriptions.Item>
                <Descriptions.Item label="Roll number">{verifyCertificate.data.rollNumber}</Descriptions.Item>
                <Descriptions.Item label="Issued at">{formatDateTime(verifyCertificate.data.issuedAt)}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert type="error" message="Invalid or unknown verification code" showIcon />
            )}
          </div>
        )}
      </Card>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Student"
            style={{ width: 220 }}
            value={studentId}
            onChange={(value) => {
              setStudentId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={(studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
          />
          <Select<CertificateRequestStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'REQUESTED', label: 'Requested' },
              { value: 'ISSUED', label: 'Issued' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </Flex>

        <Table<CertificateRequest>
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

      <CertificateRequestFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <RejectModal requestId={rejectingId} onClose={() => setRejectingId(undefined)} />
    </div>
  )
}

function CertificateTypesTab() {
  const query = useCertificateTypesQuery()
  const deleteCertificateType = useDeleteCertificateType()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const columns: TableProps<{ id: string; name: string; category?: string | null }>['columns'] = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category', render: (value: string | null) => value ?? '—' },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Delete certificate type"
          description={`Delete "${record.name}"? This cannot be undone.`}
          onConfirm={() => deleteCertificateType.mutateAsync(record.id).catch(() => undefined)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Add certificate type
        </Button>
      </Flex>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data}
          loading={query.isPending}
          pagination={false}
        />
      </Card>

      <CertificateTypeFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export function CertificatesPage() {
  const items = [
    { key: 'requests', label: 'Requests', children: <CertificateRequestsTab /> },
    { key: 'types', label: 'Certificate types', children: <CertificateTypesTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Certificates
      </Typography.Title>
      <Tabs defaultActiveKey="requests" items={items} />
    </div>
  )
}
