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
        <>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `color-mix(in srgb, ${iconColor} 14%, white)`,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            {icon}
          </div>
          <Statistic title={title} value={value} suffix={suffix} />
        </>
      )}
    </Card>
  )
}
