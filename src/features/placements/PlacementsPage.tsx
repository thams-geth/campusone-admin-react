import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Flex, Popconfirm, Table, Tabs, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Company, JobOpening } from '@/services/api/placementsApi'
import { useCompaniesQuery, useDeleteCompany, useJobOpeningsQuery } from '@/features/placements/hooks'
import { CompanyFormDrawer } from '@/features/placements/CompanyFormDrawer'
import { JobOpeningFormDrawer } from '@/features/placements/JobOpeningFormDrawer'
import { formatDate } from '@/utils/formatDate'

function formatCtc(value: number | null | undefined): string {
  return value != null ? `${value} LPA` : '—'
}

export function JobOpeningsTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useJobOpeningsQuery({ page, pageSize })
  const companiesQuery = useCompaniesQuery()

  const companyById = useMemo(() => new Map((companiesQuery.data ?? []).map((c) => [c.id, c])), [companiesQuery.data])

  const columns: TableProps<JobOpening>['columns'] = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (_, record) => (
        <Link to={`/placements/${record.id}`}>
          <Typography.Text strong>{record.title}</Typography.Text>
        </Link>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'companyId',
      render: (value: string) => companyById.get(value)?.name ?? '—',
    },
    {
      title: 'Min CGPA',
      dataIndex: 'minCgpa',
      width: 110,
      render: (value: number | null) => value ?? '—',
    },
    {
      title: 'CTC offered',
      dataIndex: 'ctcOffered',
      width: 120,
      render: formatCtc,
    },
    {
      title: 'Application deadline',
      dataIndex: 'applicationDeadline',
      width: 170,
      render: formatDate,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Add opening
        </Button>
      </Flex>

      <Card>
        <Table<JobOpening>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          onRow={() => ({ style: { cursor: 'pointer' } })}
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

      <JobOpeningFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — Tabs + a Popconfirm interaction is known to hang under jsdom (see LeavePage.test.tsx for the same pattern). */
export function CompaniesTab() {
  const query = useCompaniesQuery()
  const deleteCompany = useDeleteCompany()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const columns: TableProps<Company>['columns'] = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Website',
      dataIndex: 'website',
      render: (value: string | null) =>
        value ? (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Delete company"
          description={`Delete "${record.name}"? This cannot be undone.`}
          onConfirm={() => deleteCompany.mutateAsync(record.id).catch(() => undefined)}
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
          Add company
        </Button>
      </Flex>

      <Card>
        <Table<Company> rowKey="id" columns={columns} dataSource={query.data} loading={query.isPending} pagination={false} />
      </Card>

      <CompanyFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export function PlacementsPage() {
  const items = [
    { key: 'openings', label: 'Job openings', children: <JobOpeningsTab /> },
    { key: 'companies', label: 'Companies', children: <CompaniesTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Placements
      </Typography.Title>
      <Tabs defaultActiveKey="openings" items={items} />
    </div>
  )
}
