import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Empty, Skeleton, Typography } from 'antd'
import type { DepartmentDistributionPoint } from '@/services/api/dashboardApi'
import { CATEGORICAL_PALETTE, CHART_INK } from '@/features/dashboard/palette'

interface DepartmentDistributionChartProps {
  data?: DepartmentDistributionPoint[]
  loading: boolean
}

export function DepartmentDistributionChart({ data, loading }: DepartmentDistributionChartProps) {
  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Students by department
      </Typography.Title>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data || data.length === 0 ? (
        <Empty description="No active departments" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid stroke={CHART_INK.gridline} vertical={false} />
            <XAxis
              dataKey="code"
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
              formatter={(value) => [value, 'Students']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
              contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
            />
            <Bar dataKey="studentCount" name="Students" radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList dataKey="studentCount" position="top" style={{ fill: CHART_INK.secondary, fontSize: 12 }} />
              {data.map((entry, index) => (
                <Cell key={entry.departmentId} fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
