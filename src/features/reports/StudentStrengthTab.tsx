import { useMemo, useState } from 'react'
import { Card, Col, Flex, Row, Select } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import {
  useAllBatchesForReports,
  useAllDepartmentsForReports,
  useAllProgramsForReports,
  useAllSectionsForReports,
  useStudentStrengthReport,
} from '@/features/reports/hooks'
import { ReportStat } from '@/features/reports/components/ReportStat'
import { CategoryBarChart } from '@/features/reports/components/CategoryBarChart'

/**
 * Exported so tests can render this tab's content directly, without antd's
 * Tabs wrapper (see ReportsPage.tsx / the reports test files).
 *
 * Filters are intentionally not cascading (department -> program -> batch
 * -> section each list independently of the others' current selection) —
 * this report has no create/edit flow to justify the extra plumbing, and
 * the four are equally valid independent narrowing filters server-side.
 */
export function StudentStrengthTab() {
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined)
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [batchId, setBatchId] = useState<string | undefined>(undefined)
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)

  const departmentsQuery = useAllDepartmentsForReports()
  const programsQuery = useAllProgramsForReports()
  const batchesQuery = useAllBatchesForReports()
  const sectionsQuery = useAllSectionsForReports()

  const reportQuery = useStudentStrengthReport({ departmentId, programId, batchId, sectionId })

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of departmentsQuery.data?.data ?? []) map.set(d.id, d.name)
    return map
  }, [departmentsQuery.data])

  const byDepartmentChartData = useMemo(
    () =>
      (reportQuery.data?.byDepartment ?? []).map((row) => ({
        name: departmentNameById.get(row.departmentId) ?? row.departmentId,
        value: row.count,
      })),
    [reportQuery.data, departmentNameById],
  )

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap>
          <Select<string | undefined>
            allowClear
            placeholder="Department"
            style={{ width: 200 }}
            value={departmentId}
            loading={departmentsQuery.isPending}
            onChange={setDepartmentId}
            options={(departmentsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Program"
            style={{ width: 200 }}
            value={programId}
            loading={programsQuery.isPending}
            onChange={setProgramId}
            options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Batch"
            style={{ width: 200 }}
            value={batchId}
            loading={batchesQuery.isPending}
            onChange={setBatchId}
            options={(batchesQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select<string | undefined>
            allowClear
            placeholder="Section"
            style={{ width: 200 }}
            value={sectionId}
            loading={sectionsQuery.isPending}
            onChange={setSectionId}
            options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <ReportStat
            title="Total students"
            value={reportQuery.data?.total}
            loading={reportQuery.isPending}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col xs={24} md={16}>
          <CategoryBarChart
            title="Students by department"
            valueLabel="Students"
            data={byDepartmentChartData}
            loading={reportQuery.isPending || departmentsQuery.isPending}
            emptyDescription="No students found for the selected filters"
          />
        </Col>
      </Row>
    </div>
  )
}
