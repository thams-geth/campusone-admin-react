import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Empty, Skeleton, Typography } from 'antd'
import type { EnrollmentTrendPoint } from '@/services/api/dashboardApi'
import { ACCENT_COLOR, CHART_INK } from '@/features/dashboard/palette'

interface EnrollmentTrendChartProps {
  data?: EnrollmentTrendPoint[]
  loading: boolean
}

export function EnrollmentTrendChart({ data, loading }: EnrollmentTrendChartProps) {
  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Enrollment trend
      </Typography.Title>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data || data.length === 0 ? (
        <Empty description="No admissions recorded yet" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_INK.gridline} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={CHART_INK.muted}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.baseline }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke={CHART_INK.muted}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              width={32}
            />
            <Tooltip
              formatter={(value) => [value, 'New students']}
              contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="New students"
              stroke={ACCENT_COLOR}
              strokeWidth={2}
              fill={ACCENT_COLOR}
              fillOpacity={0.1}
              dot={{ r: 4, fill: ACCENT_COLOR, stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
