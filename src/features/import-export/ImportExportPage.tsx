import { useState } from 'react'
import { Alert, Button, Card, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  StudentImportCommitResult,
  StudentImportRowResult,
  StudentStatus,
} from '@/services/api/importExportApi'
import {
  useAllDepartmentsForImportExport,
  useCommitStudentImport,
  useExportStudentsCsv,
  usePreviewStudentImport,
} from '@/features/import-export/hooks'

/** Flattens Zod's `{ field: [messages] }` map into `field: message` display lines. */
function flattenErrors(errors: Record<string, string[] | undefined> | undefined): string[] {
  if (!errors) return []
  const lines: string[] = []
  for (const [field, messages] of Object.entries(errors)) {
    for (const message of messages ?? []) lines.push(`${field}: ${message}`)
  }
  return lines
}

/** Exported so tests can render just this section directly. See ImportExportPage.test.tsx. */
export function StudentImportCard() {
  const [csv, setCsv] = useState('')
  const previewImport = usePreviewStudentImport()
  const commitImport = useCommitStudentImport()

  async function handleFile(file: File) {
    const text = await file.text()
    setCsv(text)
  }

  const previewColumns: TableProps<StudentImportRowResult>['columns'] = [
    { title: 'Row', dataIndex: 'row', width: 80 },
    {
      title: 'Valid',
      dataIndex: 'valid',
      width: 100,
      render: (value: boolean) => <Tag color={value ? 'success' : 'error'}>{value ? 'Valid' : 'Invalid'}</Tag>,
    },
    {
      title: 'Errors',
      key: 'errors',
      render: (_, record) =>
        record.valid ? (
          '—'
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {flattenErrors(record.errors).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ),
    },
  ]

  const commitColumns: TableProps<StudentImportCommitResult['failed'][number]>['columns'] = [
    { title: 'Row', dataIndex: 'row', width: 80 },
    {
      title: 'Errors',
      key: 'errors',
      render: (_, record) => <Typography.Text type="danger">{JSON.stringify(record.errors)}</Typography.Text>,
    },
  ]

  return (
    <Card title="Import students">
      <Typography.Paragraph type="secondary">
        Paste CSV content below, or choose a .csv file to load it into the box. There's no file storage backend
        here — the CSV content is sent directly, nothing is uploaded/stored as a file.
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <input
          type="file"
          accept=".csv"
          aria-label="Choose CSV file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />

        <Input.TextArea
          rows={8}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="firstName,lastName,email,rollNumber,departmentId,..."
        />

        <Space>
          <Button
            icon={<UploadOutlined />}
            loading={previewImport.isPending}
            disabled={!csv.trim()}
            onClick={() => previewImport.mutate(csv)}
          >
            Preview
          </Button>
          <Button
            type="primary"
            loading={commitImport.isPending}
            disabled={!previewImport.data || !csv.trim()}
            onClick={() => commitImport.mutate(csv)}
          >
            Commit
          </Button>
        </Space>

        {previewImport.data && (
          <div>
            <Typography.Title level={5}>Preview result</Typography.Title>
            <Space style={{ marginBottom: 12 }}>
              <Tag>Total rows: {previewImport.data.totalRows}</Tag>
              <Tag color="success">Valid: {previewImport.data.validCount}</Tag>
              <Tag color="error">Invalid: {previewImport.data.invalidCount}</Tag>
            </Space>
            <Table
              rowKey="row"
              size="small"
              columns={previewColumns}
              dataSource={previewImport.data.results}
              pagination={false}
            />
          </div>
        )}

        {commitImport.data && (
          <div>
            <Typography.Title level={5}>Commit result</Typography.Title>
            <Space style={{ marginBottom: 12 }}>
              <Tag color="success">Created: {commitImport.data.createdCount}</Tag>
              <Tag color="error">Failed: {commitImport.data.failedCount}</Tag>
            </Space>
            {commitImport.data.failed.length > 0 && (
              <Table
                rowKey="row"
                size="small"
                columns={commitColumns}
                dataSource={commitImport.data.failed}
                pagination={false}
              />
            )}
          </div>
        )}
      </Space>
    </Card>
  )
}

/** Exported so tests can render just this section directly. See ImportExportPage.test.tsx. */
export function StudentExportCard() {
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<StudentStatus | undefined>(undefined)
  const departmentsQuery = useAllDepartmentsForImportExport()
  const exportCsv = useExportStudentsCsv()

  async function handleExport() {
    const csv = await exportCsv.mutateAsync({ departmentId, status }).catch(() => undefined)
    if (csv === undefined) return

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = 'students.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card title="Export students">
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Select<string | undefined>
          allowClear
          showSearch
          placeholder="Department"
          style={{ width: 220 }}
          value={departmentId}
          onChange={setDepartmentId}
          optionFilterProp="label"
          loading={departmentsQuery.isPending}
          options={(departmentsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
        />
        <Select<StudentStatus | undefined>
          allowClear
          placeholder="Status"
          style={{ width: 160 }}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'ALUMNI', label: 'Alumni' },
          ]}
        />
        <Button type="primary" icon={<DownloadOutlined />} loading={exportCsv.isPending} onClick={handleExport}>
          Export CSV
        </Button>
      </Flex>
      <Alert type="info" showIcon message="Downloads a students.csv file for the selected filters." />
    </Card>
  )
}

export function ImportExportPage() {
  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Import / Export
      </Typography.Title>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <StudentImportCard />
        <StudentExportCard />
      </Space>
    </div>
  )
}
