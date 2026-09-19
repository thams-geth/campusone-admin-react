import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Select, Space, Switch } from 'antd'
import type { WebhookEndpoint } from '@/services/api/webhooksApi'
import {
  WEBHOOK_EVENT_TYPE_OPTIONS,
  webhookEndpointSchema,
  type WebhookEndpointFormValues,
} from '@/features/developer/schemas'
import { useCreateWebhookEndpoint, useUpdateWebhookEndpoint } from '@/features/developer/hooks'

interface WebhookFormDrawerProps {
  open: boolean
  onClose: () => void
  endpoint?: WebhookEndpoint
}

const emptyValues: WebhookEndpointFormValues = { url: '', eventTypes: [], enabled: true }

const EVENT_TYPE_OPTIONS = WEBHOOK_EVENT_TYPE_OPTIONS.map((value) => ({ value, label: value }))

export function WebhookFormDrawer({ open, onClose, endpoint }: WebhookFormDrawerProps) {
  const isEditing = !!endpoint
  const createWebhookEndpoint = useCreateWebhookEndpoint()
  const updateWebhookEndpoint = useUpdateWebhookEndpoint()
  const submitting = createWebhookEndpoint.isPending || updateWebhookEndpoint.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookEndpointFormValues>({
    resolver: zodResolver(webhookEndpointSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        endpoint
          ? { url: endpoint.url, eventTypes: endpoint.eventTypes, enabled: endpoint.enabled }
          : emptyValues,
      )
    }
  }, [open, endpoint, reset])

  async function onSubmit(values: WebhookEndpointFormValues) {
    if (endpoint) {
      await updateWebhookEndpoint
        .mutateAsync({ id: endpoint.id, input: values }, { onSuccess: onClose })
        .catch(() => undefined)
    } else {
      await createWebhookEndpoint.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit webhook endpoint' : 'Add webhook endpoint'}
      open={open}
      onClose={onClose}
      size={480}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add endpoint'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="URL" validateStatus={errors.url ? 'error' : ''} help={errors.url?.message}>
          <Controller
            name="url"
            control={control}
            render={({ field }) => <Input {...field} placeholder="https://example.com/webhooks/campusone" />}
          />
        </Form.Item>

        <Form.Item
          label="Event types"
          validateStatus={errors.eventTypes ? 'error' : ''}
          help={errors.eventTypes?.message}
        >
          <Controller
            name="eventTypes"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select or type an event type"
                options={EVENT_TYPE_OPTIONS}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Enabled">
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
