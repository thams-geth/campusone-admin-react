import { Card, Typography } from 'antd'

export function DepartmentsPage() {
  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Departments
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        The department list and add/edit forms land in a follow-up commit.
      </Typography.Paragraph>
    </Card>
  )
}
