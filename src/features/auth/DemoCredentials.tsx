import { Collapse, Space, Tag, Typography } from 'antd'

const DEMO_EMAIL = 'admin@demo-college.test'
const DEMO_PASSWORD = 'Passw0rd!'

interface DemoCredentialsProps {
  onSelect: (email: string, password: string) => void
}

/** The one account campusone-api's `npm run prisma:seed` creates (SUPER_ADMIN on the demo tenant). */
export function DemoCredentials({ onSelect }: DemoCredentialsProps) {
  return (
    <Collapse
      ghost
      size="small"
      items={[
        {
          key: 'demo',
          label: (
            <Space size={6}>
              <Tag color="purple">Demo</Tag>
              <Typography.Text type="secondary">Use the seeded demo account</Typography.Text>
            </Space>
          ),
          children: (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Link onClick={() => onSelect(DEMO_EMAIL, DEMO_PASSWORD)}>
                SUPER ADMIN — {DEMO_EMAIL}
              </Typography.Link>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Password: {DEMO_PASSWORD}. Seeded by `npm run prisma:seed` in campusone-api.
              </Typography.Text>
            </Space>
          ),
        },
      ]}
    />
  )
}
