import { useState } from 'react'
import { Card, Col, Empty, Flex, Row, Select } from 'antd'
import { useAllExamsForReports, useExamResultsReport } from '@/features/reports/hooks'
import { ReportStat } from '@/features/reports/components/ReportStat'

/**
 * Exported so tests can render this tab's content directly, without antd's
 * Tabs wrapper. Unlike the other seven reports, `examId` is a required
 * server-side param (not optional) — this tab shows an exam picker plus an
 * empty state until one is selected, then the report's own query only runs
 * once an exam is chosen (see useExamResultsReport's `enabled`).
 */
export function ExamResultsTab() {
  const [examId, setExamId] = useState<string | undefined>(undefined)

  const examsQuery = useAllExamsForReports()
  const reportQuery = useExamResultsReport(examId)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Select an exam"
            style={{ width: 320 }}
            value={examId}
            loading={examsQuery.isPending}
            onChange={setExamId}
            options={(examsQuery.data?.data ?? []).map((e) => ({ value: e.id, label: e.name }))}
          />
        </Flex>
      </Card>

      {!examId ? (
        <Card>
          <Empty description="Select an exam above to view its results" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <ReportStat
              title="Total assessed"
              value={reportQuery.data?.totalAssessed}
              loading={reportQuery.isPending}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ReportStat title="Passed" value={reportQuery.data?.passCount} loading={reportQuery.isPending} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ReportStat title="Failed" value={reportQuery.data?.failCount} loading={reportQuery.isPending} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <ReportStat
              title="Average %"
              value={reportQuery.data?.averagePercentage}
              loading={reportQuery.isPending}
              precision={1}
              suffix="%"
            />
          </Col>
        </Row>
      )}
    </div>
  )
}
