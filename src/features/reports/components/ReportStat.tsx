import type { ReactNode } from 'react'
import { Card, Skeleton, Statistic } from 'antd'

/** Same stat-tile shape as the dashboard's StatCard (src/features/dashboard/components/StatCard.tsx). */
interface ReportStatProps {
  title: string
  value?: number
  loading: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  precision?: number
}

export function ReportStat({ title, value, loading, prefix, suffix, precision }: ReportStatProps) {
  return (
    <Card>
      {loading ? (
        <Skeleton active paragraph={false} title={{ width: '60%' }} />
      ) : (
        <Statistic title={title} value={value} prefix={prefix} suffix={suffix} precision={precision} />
      )}
    </Card>
  )
}
