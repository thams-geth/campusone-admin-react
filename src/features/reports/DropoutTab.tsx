import { useMemo } from 'react'
import { Card, Col, Row, Table } from 'antd'
import type { TableProps } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import type { DropoutReport } from '@/services/api/reportsApi'
import { useAllDepartmentsForReports, useDropoutReport } from '@/features/reports/hooks'
import { ReportStat } from '@/features/reports/components/ReportStat'
import { CategoryBarChart } from '@/features/reports/components/CategoryBarChart'

type DropoutStudentRow = DropoutReport['students'][number]

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function DropoutTab() {
  const departmentsQuery = useAllDepartmentsForReports()
  const query = useDropoutReport()

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of departmentsQuery.data?.data ?? []) map.set(d.id, d.name)
    return map
  }, [departmentsQuery.data])

  const byDepartmentChartData = useMemo(
    () =>
      (query.data?.byDepartment ?? []).map((row) => ({
        name: departmentNameById.get(row.departmentId) ?? row.departmentId,
        value: row.count,
      })),
    [query.data, departmentNameById],
  )

  const columns: TableProps<DropoutStudentRow>['columns'] = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    { title: 'Roll number', dataIndex: 'rollNumber', width: 160 },
    {
      title: 'Department',
      dataIndex: 'departmentId',
      render: (value: string) => departmentNameById.get(value) ?? value,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <ReportStat
            title="Total dropouts"
            value={query.data?.total}
            loading={query.isPending}
            prefix={<WarningOutlined />}
          />
        </Col>
        <Col xs={24} md={16}>
          <CategoryBarChart
            title="Dropouts by department"
            valueLabel="Students"
            data={byDepartmentChartData}
            loading={query.isPending || departmentsQuery.isPending}
            emptyDescription="No dropouts recorded"
          />
        </Col>
      </Row>

      <Card>
        <Table<DropoutStudentRow>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.students}
          loading={query.isPending}
          pagination={false}
        />
      </Card>
    </div>
  )
}
