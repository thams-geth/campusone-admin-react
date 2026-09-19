import { useState } from 'react'
import { Badge, Button, Card, Empty, Flex, List, Segmented, Skeleton, Switch, Typography } from 'antd'
import type { Notification, NotificationChannel } from '@/services/api/notificationsApi'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPreferencesQuery,
  useNotificationsQuery,
  useSetNotificationPreference,
  useUnreadNotificationCount,
} from '@/features/notifications/hooks'
import { formatDateTime } from '@/utils/formatDate'

const CHANNEL_LABEL: Record<Exclude<NotificationChannel, 'IN_APP'>, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push',
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markNotificationRead = useMarkNotificationRead()
  const isUnread = !notification.readAt

  return (
    <List.Item
      style={{ cursor: isUnread ? 'pointer' : 'default', background: isUnread ? 'rgba(22,119,255,0.05)' : undefined }}
      onClick={() => {
        if (isUnread) markNotificationRead.mutate(notification.id)
      }}
    >
      <List.Item.Meta
        avatar={isUnread ? <Badge status="processing" /> : <Badge status="default" />}
        title={
          <Typography.Text strong={isUnread} type={isUnread ? undefined : 'secondary'}>
            {notification.title}
          </Typography.Text>
        }
        description={
          <div>
            <Typography.Text type="secondary">{notification.body}</Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {notification.type} · {formatDateTime(notification.createdAt)}
              </Typography.Text>
            </div>
          </div>
        }
      />
    </List.Item>
  )
}

function PreferencesPanel() {
  const query = useNotificationPreferencesQuery()
  const setPreference = useSetNotificationPreference()

  return (
    <Card
      title="Delivery channel preferences"
      style={{ marginTop: 16 }}
    >
      <Typography.Paragraph type="secondary">
        These control EMAIL/SMS/PUSH delivery only. In-app notifications (this list) are always on and can't be
        disabled.
      </Typography.Paragraph>
      {query.isPending ? (
        <Skeleton active />
      ) : (
        <List
          dataSource={query.data ?? []}
          renderItem={(pref) => (
            <List.Item
              actions={[
                <Switch
                  key="toggle"
                  checked={pref.enabled}
                  loading={setPreference.isPending}
                  onChange={(checked) => setPreference.mutate({ channel: pref.channel, input: { enabled: checked } })}
                />,
              ]}
            >
              {CHANNEL_LABEL[pref.channel]}
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const query = useNotificationsQuery({ page, pageSize, unreadOnly })
  const unreadCountQuery = useUnreadNotificationCount()
  const markAllNotificationsRead = useMarkAllNotificationsRead()

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap>
        <Flex align="center" gap={12}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Notifications
          </Typography.Title>
          <Badge count={unreadCountQuery.data ?? 0} showZero={false} />
        </Flex>
        <Button
          onClick={() => markAllNotificationsRead.mutate()}
          loading={markAllNotificationsRead.isPending}
          disabled={!unreadCountQuery.data}
        >
          Mark all read
        </Button>
      </Flex>

      <Card>
        <Flex style={{ marginBottom: 16 }}>
          <Segmented
            value={unreadOnly ? 'unread' : 'all'}
            onChange={(value) => {
              setUnreadOnly(value === 'unread')
              setPage(1)
            }}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Unread', value: 'unread' },
            ]}
          />
        </Flex>

        <List<Notification>
          dataSource={query.data?.data ?? []}
          loading={query.isFetching}
          locale={{ emptyText: <Empty description="No notifications" /> }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.meta.total,
            onChange: (nextPage) => setPage(nextPage),
          }}
          renderItem={(notification) => <NotificationItem notification={notification} />}
        />
      </Card>

      <PreferencesPanel />
    </div>
  )
}
