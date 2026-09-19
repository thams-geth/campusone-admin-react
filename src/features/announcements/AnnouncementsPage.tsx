import { useCallback, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Announcement, AnnouncementAudience } from '@/services/api/announcementsApi'
import { useAnnouncementsQuery, useDeleteAnnouncement } from '@/features/announcements/hooks'
import { AnnouncementFormDrawer } from '@/features/announcements/AnnouncementFormDrawer'

const PRIORITY_COLOR: Record<Announcement['priority'], string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'red',
}

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  COLLEGE: 'Whole college',
  DEPARTMENT: 'Department',
  PROGRAM: 'Program',
  BATCH: 'Batch',
  SECTION: 'Section',
}

export function AnnouncementsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [audience, setAudience] = useState<AnnouncementAudience | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined)

  const query = useAnnouncementsQuery({ page, pageSize, audience })
  const deleteAnnouncement = useDeleteAnnouncement()

  const handleDelete = useCallback(
    (announcement: Announcement) => deleteAnnouncement.mutateAsync(announcement.id).catch(() => undefined),
    [deleteAnnouncement],
  )

  const columns: TableProps<Announcement>['columns'] = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.title}</Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.content.length > 80 ? `${record.content.slice(0, 80)}…` : record.content}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      width: 140,
      render: (value: AnnouncementAudience) => AUDIENCE_LABEL[value],
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (value: Announcement['priority']) => <Tag color={PRIORITY_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Publish at',
      dataIndex: 'publishAt',
      width: 160,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: 'Expires',
      dataIndex: 'expiryAt',
      width: 160,
      render: (value: string | null) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingAnnouncement(record)
              setDrawerOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete announcement"
            description={`Delete "${record.title}"? This cannot be undone.`}
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Announcements
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAnnouncement(undefined)
            setDrawerOpen(true)
          }}
        >
          Add announcement
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<AnnouncementAudience | undefined>
            allowClear
            placeholder="Audience"
            style={{ width: 180 }}
            value={audience}
            onChange={(value) => {
              setAudience(value)
              setPage(1)
            }}
            options={Object.entries(AUDIENCE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Flex>

        <Table<Announcement>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <AnnouncementFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} announcement={editingAnnouncement} />
    </div>
  )
}
