import { useMemo, useState } from 'react'
import { Button, Card, Flex, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, StarFilled } from '@ant-design/icons'
import type { AcademicYear, AcademicYearStatus } from '@/services/api/academicYearsApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { useAcademicYearsQuery, useUpdateAcademicYear } from '@/features/academic-years/hooks'
import { AcademicYearFormDrawer } from '@/features/academic-years/AcademicYearFormDrawer'
import { formatDate } from '@/utils/formatDate'

export function AcademicYearsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<AcademicYearStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | undefined>(undefined)

  const query = useAcademicYearsQuery({ page, pageSize, status })
  const updateAcademicYear = useUpdateAcademicYear()

  const handleSetCurrent = (year: AcademicYear) =>
    updateAcademicYear
      .mutateAsync({
        id: year.id,
        input: {
          name: year.name,
          startDate: year.startDate,
          endDate: year.endDate,
          status: year.status,
          isCurrent: true,
        },
      })
      .catch(() => undefined)

  const columns = useMemo<TableProps<AcademicYear>['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (_, record) => (
          <Space size={6}>
            <Typography.Text strong>{record.name}</Typography.Text>
            {record.isCurrent && <Tag icon={<StarFilled />} color="gold">Current</Tag>}
          </Space>
        ),
      },
      { title: 'Start date', dataIndex: 'startDate', width: 140, render: (value: string) => formatDate(value) },
      { title: 'End date', dataIndex: 'endDate', width: 140, render: (value: string) => formatDate(value) },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (value: AcademicYearStatus) => <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>{value}</Tag>,
      },
      ...(canManage
        ? ([
            {
              title: 'Actions',
              key: 'actions',
              width: 220,
              render: (_, record) => (
                <Space>
                  {!record.isCurrent && (
                    <Button size="small" loading={updateAcademicYear.isPending} onClick={() => handleSetCurrent(record)}>
                      Set as current
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingAcademicYear(record)
                      setDrawerOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                </Space>
              ),
            },
          ] satisfies TableProps<AcademicYear>['columns'])
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, updateAcademicYear.isPending],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Academic Years
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAcademicYear(undefined)
              setDrawerOpen(true)
            }}
          >
            Add academic year
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
          />
        </Flex>

        <Table<AcademicYear>
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

      {canManage && (
        <AcademicYearFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          academicYear={editingAcademicYear}
        />
      )}
    </div>
  )
}
