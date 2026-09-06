import { useQuery } from '@tanstack/react-query'
import { Alert, Col, Row, Typography } from 'antd'
import {
  ApartmentOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  getDashboardSummary,
  getDepartmentDistribution,
  getEnrollmentTrend,
  getRecentActivity,
} from '@/services/api/dashboardApi'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { EnrollmentTrendChart } from '@/features/dashboard/components/EnrollmentTrendChart'
import { DepartmentDistributionChart } from '@/features/dashboard/components/DepartmentDistributionChart'
import { RecentActivityList } from '@/features/dashboard/components/RecentActivityList'

export function DashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary })
  const trendQuery = useQuery({ queryKey: ['dashboard', 'trend'], queryFn: getEnrollmentTrend })
  const distributionQuery = useQuery({
    queryKey: ['dashboard', 'distribution'],
    queryFn: getDepartmentDistribution,
  })
  const activityQuery = useQuery({ queryKey: ['dashboard', 'activity'], queryFn: getRecentActivity })

  const hasError =
    summaryQuery.isError || trendQuery.isError || distributionQuery.isError || activityQuery.isError

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Typography.Title>

      {hasError && (
        <Alert
          type="error"
          showIcon
          message="Some dashboard data failed to load"
          description="Try refreshing the page."
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col flex="1 1 200px">
          <StatCard
            title="Total students"
            value={summaryQuery.data?.totalStudents}
            loading={summaryQuery.isPending}
            icon={<TeamOutlined />}
            iconColor="#2a78d6"
          />
        </Col>
        <Col flex="1 1 200px">
          <StatCard
            title="Active students"
            value={summaryQuery.data?.activeStudents}
            loading={summaryQuery.isPending}
            icon={<UserOutlined />}
            iconColor="#1baf7a"
          />
        </Col>
        <Col flex="1 1 200px">
          <StatCard
            title="Departments"
            value={summaryQuery.data?.totalDepartments}
            loading={summaryQuery.isPending}
            icon={<ApartmentOutlined />}
            iconColor="#4a3aa7"
          />
        </Col>
        <Col flex="1 1 200px">
          <StatCard
            title="Faculty"
            value={summaryQuery.data?.totalFaculty}
            loading={summaryQuery.isPending}
            icon={<SolutionOutlined />}
            iconColor="#eda100"
          />
        </Col>
        <Col flex="1 1 200px">
          <StatCard
            title="Pending admissions"
            value={summaryQuery.data?.pendingAdmissions}
            loading={summaryQuery.isPending}
            icon={<ClockCircleOutlined />}
            iconColor="#eb6834"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <EnrollmentTrendChart data={trendQuery.data} loading={trendQuery.isPending} />
        </Col>
        <Col xs={24} lg={10}>
          <DepartmentDistributionChart data={distributionQuery.data} loading={distributionQuery.isPending} />
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <RecentActivityList data={activityQuery.data} loading={activityQuery.isPending} />
        </Col>
      </Row>
    </div>
  )
}
