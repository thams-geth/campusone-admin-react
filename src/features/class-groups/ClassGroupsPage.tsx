import { useMemo, useState } from 'react'
import { Button, Card, Empty, Flex, Input, List, Select, Typography } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ClassGroupMessage } from '@/services/api/classGroupsApi'
import {
  useAllBatchesForClassGroups,
  useAllSectionsForClassGroups,
  useClassGroupMessagesQuery,
  usePostClassGroupMessage,
} from '@/features/class-groups/hooks'
import { formatDateTime } from '@/utils/formatDate'

function MessageCard({ message }: { message: ClassGroupMessage }) {
  return (
    <List.Item>
      <Card size="small" style={{ width: '100%' }}>
        <Flex justify="space-between" align="baseline">
          <Typography.Text strong>{message.author.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(message.createdAt)}
          </Typography.Text>
        </Flex>
        <Typography.Paragraph style={{ marginBottom: 0, marginTop: 4, whiteSpace: 'pre-wrap' }}>
          {message.body}
        </Typography.Paragraph>
      </Card>
    </List.Item>
  )
}

export function ClassGroupsPage() {
  const [sectionId, setSectionId] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState('')

  const sectionsQuery = useAllSectionsForClassGroups()
  const batchesQuery = useAllBatchesForClassGroups()
  const messagesQuery = useClassGroupMessagesQuery(sectionId, { page: 1, pageSize: 100 })
  const postMessage = usePostClassGroupMessage(sectionId)

  const batchNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of batchesQuery.data?.data ?? []) map.set(b.id, b.name)
    return map
  }, [batchesQuery.data])

  const sectionOptions = useMemo(
    () =>
      (sectionsQuery.data?.data ?? []).map((s) => ({
        value: s.id,
        label: batchNameById.get(s.batchId) ? `${s.name} (${batchNameById.get(s.batchId)})` : s.name,
      })),
    [sectionsQuery.data, batchNameById],
  )

  async function handlePost() {
    const body = draft.trim()
    if (!body || !sectionId) return
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled, and
    // so the draft is cleared only on success.
    await postMessage.mutateAsync({ body }).then(
      () => setDraft(''),
      () => undefined,
    )
  }

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Class Groups
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Select<string | undefined>
          allowClear
          showSearch
          placeholder="Select a section"
          style={{ width: 320 }}
          value={sectionId}
          loading={sectionsQuery.isPending}
          optionFilterProp="label"
          options={sectionOptions}
          onChange={(value) => setSectionId(value)}
        />
      </Card>

      {sectionId ? (
        <Card>
          <List<ClassGroupMessage>
            dataSource={messagesQuery.data?.data ?? []}
            loading={messagesQuery.isFetching}
            locale={{ emptyText: <Empty description="No messages yet" /> }}
            renderItem={(message) => <MessageCard message={message} />}
            style={{ marginBottom: 16 }}
          />

          <Flex gap={8}>
            <Input.TextArea
              rows={2}
              value={draft}
              placeholder="Write a message to this class group…"
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handlePost()
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={postMessage.isPending}
              disabled={!draft.trim()}
              onClick={handlePost}
            >
              Post
            </Button>
          </Flex>
        </Card>
      ) : (
        <Card>
          <Empty description="Pick a section to view its class group" />
        </Card>
      )}
    </div>
  )
}
