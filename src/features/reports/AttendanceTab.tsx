import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Card, Col, DatePicker, Flex, Progress, Row, Select, Typography } from 'antd'
import { useAllSectionsForReports, useAllSubjectsForReports, useAttendanceReport } from '@/features/reports/hooks'
import { ReportStat } from '@/features/reports/components/ReportStat'

const DATE_FORMAT = 'YYYY-MM-DD'

/** Exported so tests can render this tab's content directly, without antd's Tabs wrapper. */
export function AttendanceTab() {
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null)
  const [dateTo, setDateTo] = useState<Dayjs | null>(null)

  const sectionsQuery = useAllSectionsForReports()
  const subjectsQuery = useAllSubjectsForReports()

  const reportQuery = useAttendanceReport({
    sectionId,
    subjectId,
    dateFrom: dateFrom ? dateFrom.format(DATE_FORMAT) : undefined,
    dateTo: dateTo ? dateTo.format(DATE_FORMAT) : undefined,
  })

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Section"
            style={{ width: 200 }}
            value={sectionId}
            loading={sectionsQuery.isPending}
            onChange={setSectionId}
            options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Subject"
            style={{ width: 220 }}
            value={subjectId}
            loading={subjectsQuery.isPending}
            onChange={setSubjectId}
            options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          />
          <DatePicker placeholder="From date" value={dateFrom} onChange={setDateFrom} />
          <DatePicker placeholder="To date" value={dateTo} onChange={setDateTo} />
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <ReportStat title="Total sessions" value={reportQuery.data?.totalSessions} loading={reportQuery.isPending} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ReportStat title="Total records" value={reportQuery.data?.totalRecords} loading={reportQuery.isPending} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ReportStat title="Present count" value={reportQuery.data?.presentCount} loading={reportQuery.isPending} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Typography.Text type="secondary">Attendance %</Typography.Text>
            <Flex justify="center" style={{ marginTop: 8 }}>
              <Progress
                type="circle"
                size={100}
                percent={reportQuery.data ? Math.round(reportQuery.data.attendancePercentage) : 0}
                status={reportQuery.isPending ? 'normal' : undefined}
              />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
