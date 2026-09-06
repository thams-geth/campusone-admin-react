import { Avatar, Card, List, Skeleton, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { ActivityItem } from '@/services/api/dashboardApi'
import { formatRelativeTime } from '@/utils/relativeTime'

interface RecentActivityListProps {
  data?: ActivityItem[]
  loading: boolean
}

export function RecentActivityList({ data, loading }: RecentActivityListProps) {
  return (
    <Card>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Recent activity
      </Typography.Title>
      {loading ? (
        <Skeleton active avatar paragraph={{ rows: 3 }} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Typography.Text>
                    <Typography.Text strong>{item.actor}</Typography.Text> {item.message}
                  </Typography.Text>
                }
                description={formatRelativeTime(item.timestamp)}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
