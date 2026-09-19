import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, Flex, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ApiKey, CreatedApiKey } from '@/services/api/apiKeysApi'
import { apiKeySchema, type ApiKeyFormValues } from '@/features/developer/schemas'
import { useApiKeysQuery, useCreateApiKey, useRevokeApiKey } from '@/features/developer/hooks'

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Never'
}

/**
 * Exported so tests can render just this tab's content directly, without
 * antd's Tabs wrapper — Tabs + Popconfirm inside jsdom is known to hang
 * (see LeavePage.tsx's note), so tests target this component instead of
 * DeveloperSettingsPage.
 */
export function ApiKeysTab() {
  const query = useApiKeysQuery()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()

  const [formOpen, setFormOpen] = useState(false)
  // The raw key only ever lives here, set once right after a successful
  // create and never written into any list/cache — closing the modal
  // clears it, and it is never re-derived from anything persisted.
  const [revealedKey, setRevealedKey] = useState<CreatedApiKey | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { name: '' },
  })

  async function onSubmit(values: ApiKeyFormValues) {
    const created = await createApiKey.mutateAsync(values).catch(() => undefined)
    if (created) {
      setFormOpen(false)
      reset({ name: '' })
      setRevealedKey(created)
    }
  }

  const columns: TableProps<ApiKey>['columns'] = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Key',
      dataIndex: 'keyPrefix',
      render: (value: string) => <Typography.Text code>{value}…</Typography.Text>,
    },
    {
      title: 'Last used',
      dataIndex: 'lastUsedAt',
      width: 200,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) =>
        record.revokedAt ? <Tag color="error">Revoked</Tag> : <Tag color="success">Active</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: 200,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        !record.revokedAt ? (
          <Popconfirm
            title="Revoke this API key"
            description="This is permanent — any client using this key will immediately lose access. This cannot be undone."
            onConfirm={() => revokeApiKey.mutate(record.id)}
            okText="Revoke"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Revoke
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            reset({ name: '' })
            setFormOpen(true)
          }}
        >
          Create key
        </Button>
      </Flex>

      <Card>
        <Table<ApiKey> rowKey="id" columns={columns} dataSource={query.data} loading={query.isFetching} pagination={false} />
      </Card>

      <Modal
        title="Create API key"
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit(onSubmit)}
        confirmLoading={createApiKey.isPending}
        okText="Create"
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
          <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} placeholder="CI pipeline" autoFocus />}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="API key created"
        open={!!revealedKey}
        onCancel={() => setRevealedKey(null)}
        footer={
          <Button type="primary" onClick={() => setRevealedKey(null)}>
            Done — I've copied it
          </Button>
        }
        closable={false}
        maskClosable={false}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          message="Copy this key now"
          description="This is the only time the full key is shown. It cannot be retrieved again once this dialog is closed — if it's lost, revoke it and create a new one."
          style={{ marginBottom: 16 }}
        />
        <Typography.Paragraph
          copyable={{ text: revealedKey?.key ?? '' }}
          code
          style={{ wordBreak: 'break-all', marginBottom: 0 }}
        >
          {revealedKey?.key}
        </Typography.Paragraph>
        <Space direction="vertical" style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">Name: {revealedKey?.name}</Typography.Text>
        </Space>
      </Modal>
    </div>
  )
}
