import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { Card, Empty, Skeleton, Typography } from 'antd'

/**
 * Same recharts bar-chart approach as the dashboard's
 * DepartmentDistributionChart (src/features/dashboard/components), reused
 * here for every report's "count/amount by category" breakdown
 * (student strength / dropout by department, financial summary by
 * category) instead of introducing a second charting pattern.
 */
const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
] as const

const CHART_INK = {
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
}

export interface CategoryBarChartDatum {
  name: string
  value: number
}

interface CategoryBarChartProps {
  title: string
  valueLabel: string
  data?: CategoryBarChartDatum[]
  loading: boolean
  emptyDescription?: string
}

export function CategoryBarChart({ title, valueLabel, data, loading, emptyDescription }: CategoryBarChartProps) {
  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data || data.length === 0 ? (
        <Empty description={emptyDescription ?? 'No data'} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid stroke={CHART_INK.gridline} vertical={false} />
            <XAxis
              dataKey="name"
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
              formatter={(value) => [value, valueLabel]}
              contentStyle={{ borderRadius: 8, borderColor: CHART_INK.gridline }}
            />
            <Bar
              dataKey="value"
              name={valueLabel}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              shape={(props: BarShapeProps) => {
                const { index, ...rest } = props
                const fill = CATEGORICAL_PALETTE[(index ?? 0) % CATEGORICAL_PALETTE.length]
                return <Rectangle {...rest} fill={fill} />
              }}
            >
              <LabelList dataKey="value" position="top" style={{ fill: CHART_INK.secondary, fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
