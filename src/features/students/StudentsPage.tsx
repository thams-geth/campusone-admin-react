import { Card, Typography } from 'antd'

export function StudentsPage() {
  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Students
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        The student list, add/edit forms, and details view land in a follow-up commit.
      </Typography.Paragraph>
    </Card>
  )
}
