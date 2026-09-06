import { Card, Typography } from 'antd'

export function DashboardPage() {
  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Dashboard
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Stats, enrollment trends, and recent activity land in the next commit.
      </Typography.Paragraph>
    </Card>
  )
}
