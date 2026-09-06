import type { ReactNode } from 'react'
import { Card, Skeleton, Statistic } from 'antd'

interface StatCardProps {
  title: string
  value?: number
  icon: ReactNode
  iconColor: string
  loading: boolean
  suffix?: string
}

export function StatCard({ title, value, icon, iconColor, loading, suffix }: StatCardProps) {
  return (
    <Card>
      {loading ? (
        <Skeleton active paragraph={false} title={{ width: '60%' }} />
      ) : (
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          prefix={<span style={{ color: iconColor, marginRight: 4 }}>{icon}</span>}
        />
      )}
    </Card>
  )
}
