import { Card, Col, Row, Table } from 'antd'
import type { TableProps } from 'antd'
import type { FinancialSummaryReport } from '@/services/api/reportsApi'
import { useFinancialSummaryReport } from '@/features/reports/hooks'
import { ReportStat } from '@/features/reports/components/ReportStat'

type ByCategoryRow = FinancialSummaryReport['byCategory'][number]

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function FinancialSummaryTab() {
  const query = useFinancialSummaryReport()

  const columns: TableProps<ByCategoryRow>['columns'] = [
    { title: 'Category', dataIndex: 'category' },
    {
      title: 'Invoiced',
      dataIndex: 'invoiced',
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Collected',
      dataIndex: 'collected',
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstanding',
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <ReportStat title="Total invoiced" value={query.data?.totalInvoiced} loading={query.isPending} prefix="₹" />
        </Col>
        <Col xs={24} md={8}>
          <ReportStat
            title="Total collected"
            value={query.data?.totalCollected}
            loading={query.isPending}
            prefix="₹"
          />
        </Col>
        <Col xs={24} md={8}>
          <ReportStat
            title="Total outstanding"
            value={query.data?.totalOutstanding}
            loading={query.isPending}
            prefix="₹"
          />
        </Col>
      </Row>

      <Card>
        <Table<ByCategoryRow>
          rowKey="category"
          columns={columns}
          dataSource={query.data?.byCategory}
          loading={query.isPending}
          pagination={false}
        />
      </Card>
    </div>
  )
}
