import { Collapse, Space, Tag, Typography } from 'antd'
import type { Role } from '@/types/user'

const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: 'SUPER_ADMIN', email: 'super.admin@aurora.edu' },
  { role: 'COLLEGE_ADMIN', email: 'college.admin@aurora.edu' },
  { role: 'DEPARTMENT_ADMIN', email: 'dept.admin@aurora.edu' },
  { role: 'FACULTY', email: 'faculty@aurora.edu' },
  { role: 'STAFF', email: 'staff@aurora.edu' },
]

const DEMO_PASSWORD = 'Passw0rd!'

interface DemoCredentialsProps {
  onSelect: (email: string, password: string) => void
}

/** Convenience for reviewers/testers — there is no real backend yet. */
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
              <Typography.Text type="secondary">Use a sample account</Typography.Text>
            </Space>
          ),
          children: (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              {DEMO_ACCOUNTS.map((account) => (
                <Typography.Link
                  key={account.email}
                  onClick={() => onSelect(account.email, DEMO_PASSWORD)}
                >
                  {account.role.replace('_', ' ')} — {account.email}
                </Typography.Link>
              ))}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Password for all demo accounts: {DEMO_PASSWORD}
              </Typography.Text>
            </Space>
          ),
        },
      ]}
    />
  )
}
