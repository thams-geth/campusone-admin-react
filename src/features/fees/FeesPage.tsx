import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Select, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { FeeCategory, FeeInvoice, FeeInvoiceStatus, FeeStructure } from '@/services/api/feesApi'
import {
  useAllAcademicYearsForFees,
  useAllProgramsForFees,
  useAllStudentsForFees,
  useDeleteFeeStructure,
  useFeeInvoicesQuery,
  useFeeStructuresQuery,
} from '@/features/fees/hooks'
import { FeeInvoiceFormDrawer } from '@/features/fees/FeeInvoiceFormDrawer'
import { FeeStructureFormDrawer } from '@/features/fees/FeeStructureFormDrawer'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<FeeInvoiceStatus, string> = {
  PENDING: 'gold',
  PARTIAL: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  WAIVED: 'default',
}

const CATEGORY_OPTIONS: { value: FeeCategory; label: string }[] = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'LIBRARY', label: 'Library' },
  { value: 'LAB', label: 'Lab' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_OPTIONS: { value: FeeInvoiceStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'WAIVED', label: 'Waived' },
]

/** Exported so tests can render just this tab's content directly — see the module's InvoicesTab test. */
export function InvoicesTab() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<FeeInvoiceStatus | undefined>(undefined)
  const [category, setCategory] = useState<FeeCategory | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useFeeInvoicesQuery({ page, pageSize, studentId, status, category })
  const studentsQuery = useAllStudentsForFees()

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, `${s.firstName} ${s.lastName} (${s.rollNumber})`)
    }
    return map
  }, [studentsQuery.data])

  const columns: TableProps<FeeInvoice>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 120,
      render: (value: FeeCategory) => <Tag>{value}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Due date',
      dataIndex: 'dueDate',
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: FeeInvoiceStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          New invoice
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Student"
            style={{ width: 220 }}
            loading={studentsQuery.isPending}
            optionFilterProp="label"
            value={studentId}
            onChange={(value) => {
              setStudentId(value)
              setPage(1)
            }}
            options={(studentsQuery.data?.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
            }))}
          />
          <Select<FeeInvoiceStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />
          <Select<FeeCategory | undefined>
            allowClear
            placeholder="Category"
            style={{ width: 160 }}
            value={category}
            onChange={(value) => {
              setCategory(value)
              setPage(1)
            }}
            options={CATEGORY_OPTIONS}
          />
        </Flex>

        <Table<FeeInvoice>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          onRow={(record) => ({
            onClick: () => navigate(`/fees/invoices/${record.id}`),
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

      <FeeInvoiceFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

/**
 * Exported so tests can render just this tab's content directly, without
 * antd's Tabs wrapper — Tabs + a Popconfirm inside one of its panes causes
 * a severe jsdom-only slowdown in tests (not a real bug, confirmed fine in
 * real browsers). See LeavePage.tsx / LeavePage.test.tsx for the same
 * pattern applied there.
 */
export function FeeStructuresTab() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const query = useFeeStructuresQuery({ page: 1, pageSize: 100 })
  const programsQuery = useAllProgramsForFees()
  const academicYearsQuery = useAllAcademicYearsForFees()
  const deleteFeeStructure = useDeleteFeeStructure()

  const programNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of programsQuery.data?.data ?? []) {
      map.set(p.id, `${p.name} (${p.code})`)
    }
    return map
  }, [programsQuery.data])

  const academicYearNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const y of academicYearsQuery.data?.data ?? []) {
      map.set(y.id, y.name)
    }
    return map
  }, [academicYearsQuery.data])

  const columns: TableProps<FeeStructure>['columns'] = [
    {
      title: 'Program',
      dataIndex: 'programId',
      render: (value: string) => programNameById.get(value) ?? value,
    },
    {
      title: 'Academic year',
      dataIndex: 'academicYearId',
      render: (value: string) => academicYearNameById.get(value) ?? value,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 120,
      render: (value: FeeCategory) => <Tag>{value}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete fee structure"
          description="This cannot be undone."
          onConfirm={() => deleteFeeStructure.mutateAsync(record.id).catch(() => undefined)}
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
          New fee structure
        </Button>
      </Flex>

      <Card>
        <Table<FeeStructure>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={false}
        />
      </Card>

      <FeeStructureFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export function FeesPage() {
  const items = [
    { key: 'invoices', label: 'Invoices', children: <InvoicesTab /> },
    { key: 'structures', label: 'Fee structures', children: <FeeStructuresTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Fees
      </Typography.Title>
      <Tabs defaultActiveKey="invoices" items={items} />
    </div>
  )
}
