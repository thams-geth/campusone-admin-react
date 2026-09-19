import { useState } from 'react'
import { Card, Flex, Select, Table } from 'antd'
import type { TableProps } from 'antd'
import type { SubjectPerformanceRow } from '@/services/api/reportsApi'
import { useAllProgramsForReports, useSubjectPerformanceReport } from '@/features/reports/hooks'

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function SubjectPerformanceTab() {
  const [programId, setProgramId] = useState<string | undefined>(undefined)

  const programsQuery = useAllProgramsForReports()
  const query = useSubjectPerformanceReport({ programId })

  const columns: TableProps<SubjectPerformanceRow>['columns'] = [
    { title: 'Code', dataIndex: 'code', width: 120 },
    { title: 'Subject', dataIndex: 'name' },
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
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Program"
            style={{ width: 220 }}
            value={programId}
            loading={programsQuery.isPending}
            onChange={setProgramId}
            options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
        </Flex>
      </Card>

      <Card>
        <Table<SubjectPerformanceRow>
          rowKey="subjectId"
          columns={columns}
          dataSource={query.data}
          loading={query.isPending}
          pagination={false}
        />
      </Card>
    </div>
  )
}
