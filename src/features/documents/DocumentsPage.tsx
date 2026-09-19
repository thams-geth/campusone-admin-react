import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Document, DocumentOwnerType, DocumentStatus, DocumentType } from '@/services/api/documentsApi'
import {
  useAllApplicantsForDocuments,
  useAllFacultyForDocuments,
  useAllStudentsForDocuments,
  useDeleteDocument,
  useDocumentsQuery,
  useRejectDocument,
  useVerifyDocument,
} from '@/features/documents/hooks'
import { DocumentFormDrawer } from '@/features/documents/DocumentFormDrawer'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<DocumentStatus, string> = {
  PENDING: 'gold',
  VERIFIED: 'success',
  REJECTED: 'error',
}

const OWNER_TYPE_LABEL: Record<DocumentOwnerType, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  APPLICANT: 'Applicant',
}

const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  BONAFIDE: 'Bonafide',
  TRANSFER_CERTIFICATE: 'Transfer certificate',
  CONDUCT_CERTIFICATE: 'Conduct certificate',
  MARK_SHEET: 'Mark sheet',
  ID_PROOF: 'ID proof',
  OTHER: 'Other',
}

export function DocumentsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ownerType, setOwnerType] = useState<DocumentOwnerType | undefined>(undefined)
  const [type, setType] = useState<DocumentType | undefined>(undefined)
  const [status, setStatus] = useState<DocumentStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | undefined>(undefined)

  const query = useDocumentsQuery({ page, pageSize, ownerType, type, status })
  const studentsQuery = useAllStudentsForDocuments()
  const facultyQuery = useAllFacultyForDocuments()
  const applicantsQuery = useAllApplicantsForDocuments()
  const deleteDocument = useDeleteDocument()
  const verifyDocument = useVerifyDocument()
  const rejectDocument = useRejectDocument()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) map.set(s.id, `${s.firstName} ${s.lastName}`)
    return map
  }, [studentsQuery.data])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of facultyQuery.data?.data ?? []) map.set(f.id, f.name)
    return map
  }, [facultyQuery.data])

  const applicantNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of applicantsQuery.data?.data ?? []) map.set(a.id, `${a.firstName} ${a.lastName}`)
    return map
  }, [applicantsQuery.data])

  const resolveOwnerName = useCallback(
    (record: Document): string => {
      const map =
        record.ownerType === 'FACULTY' ? facultyNameById : record.ownerType === 'APPLICANT' ? applicantNameById : studentNameById
      return map.get(record.ownerId) ?? record.ownerId
    },
    [studentNameById, facultyNameById, applicantNameById],
  )

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (doc: Document) => deleteDocument.mutateAsync(doc.id).catch(() => undefined),
    [deleteDocument],
  )

  const columns = useMemo<TableProps<Document>['columns']>(
    () => [
      {
        title: 'Owner',
        key: 'owner',
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{resolveOwnerName(record)}</Typography.Text>
            <Tag>{OWNER_TYPE_LABEL[record.ownerType]}</Tag>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (value: DocumentType) => <Tag>{DOCUMENT_TYPE_LABEL[value]}</Tag>,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: DocumentStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
      },
      { title: 'Expiry date', dataIndex: 'expiryDate', width: 130, render: formatDate },
      { title: 'Version', dataIndex: 'version', width: 90, align: 'right' },
      {
        title: 'Actions',
        key: 'actions',
        width: 260,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditingDocument(record)
                setDrawerOpen(true)
              }}
            >
              Edit
            </Button>
            {record.status === 'PENDING' && (
              <>
                <Popconfirm
                  title="Verify document"
                  description="Mark this document as verified?"
                  onConfirm={() => verifyDocument.mutateAsync(record.id).catch(() => undefined)}
                  okText="Verify"
                >
                  <Button size="small" type="primary">
                    Verify
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Reject document"
                  description="Reject this document?"
                  onConfirm={() => rejectDocument.mutateAsync(record.id).catch(() => undefined)}
                  okText="Reject"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger>
                    Reject
                  </Button>
                </Popconfirm>
              </>
            )}
            <Popconfirm
              title="Delete document"
              description="Delete this document record? This cannot be undone."
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
    ],
    [handleDelete, resolveOwnerName, verifyDocument, rejectDocument],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Documents
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDocument(undefined)
            setDrawerOpen(true)
          }}
        >
          Add document
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<DocumentOwnerType | undefined>
            allowClear
            placeholder="Owner type"
            style={{ width: 160 }}
            value={ownerType}
            onChange={(value) => {
              setOwnerType(value)
              setPage(1)
            }}
            options={Object.entries(OWNER_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select<DocumentType | undefined>
            allowClear
            placeholder="Document type"
            style={{ width: 200 }}
            value={type}
            onChange={(value) => {
              setType(value)
              setPage(1)
            }}
            options={Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select<DocumentStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </Flex>

        <Table<Document>
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

      <DocumentFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        document={editingDocument}
      />
    </div>
  )
}
