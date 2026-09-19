import { Card, Table } from 'antd'
import type { TableProps } from 'antd'
import type { FacultyWorkloadRow } from '@/services/api/reportsApi'
import { useFacultyWorkloadReport } from '@/features/reports/hooks'

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function FacultyWorkloadTab() {
  const query = useFacultyWorkloadReport()

  const columns: TableProps<FacultyWorkloadRow>['columns'] = [
    { title: 'Faculty', dataIndex: 'name' },
    { title: 'Subjects assigned', dataIndex: 'subjectsAssigned', width: 160, align: 'right' },
    { title: 'Weekly periods', dataIndex: 'weeklyPeriods', width: 160, align: 'right' },
  ]

  return (
    <Card>
      <Table<FacultyWorkloadRow>
        rowKey="facultyId"
        columns={columns}
        dataSource={query.data}
        loading={query.isPending}
        pagination={false}
      />
    </Card>
  )
}
