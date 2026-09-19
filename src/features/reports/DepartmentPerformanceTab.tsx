import { Card, Table } from 'antd'
import type { TableProps } from 'antd'
import type { DepartmentPerformanceRow } from '@/services/api/reportsApi'
import { useDepartmentPerformanceReport } from '@/features/reports/hooks'

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function DepartmentPerformanceTab() {
  const query = useDepartmentPerformanceReport()

  const columns: TableProps<DepartmentPerformanceRow>['columns'] = [
    { title: 'Department', dataIndex: 'name' },
    { title: 'Students', dataIndex: 'studentCount', width: 140, align: 'right' },
    { title: 'Students assessed', dataIndex: 'studentsAssessed', width: 160, align: 'right' },
    {
      title: 'Average marks %',
      dataIndex: 'averageMarksPercentage',
      width: 160,
      align: 'right',
      render: (value: number) => `${value.toFixed(1)}%`,
    },
  ]

  return (
    <Card>
      <Table<DepartmentPerformanceRow>
        rowKey="departmentId"
        columns={columns}
        dataSource={query.data}
        loading={query.isPending}
        pagination={false}
      />
    </Card>
  )
}
