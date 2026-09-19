import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Modal, Switch } from 'antd'
import type { IntegrationConfig, IntegrationProvider } from '@/services/api/integrationsApi'
import {
  integrationSettingsSchema,
  type IntegrationSettingsFormValues,
} from '@/features/developer/schemas'
import { useUpsertIntegration } from '@/features/developer/hooks'

interface IntegrationSettingsModalProps {
  open: boolean
  onClose: () => void
  provider: IntegrationProvider
  config: IntegrationConfig | undefined
}

/**
 * Config-only, same as the backend: saving here just flips `enabled` and
 * stores whatever JSON is typed in `settings` — no live call to any
 * provider happens anywhere, so this form never implies a connection test.
 */
export function IntegrationSettingsModal({ open, onClose, provider, config }: IntegrationSettingsModalProps) {
  const upsertIntegration = useUpsertIntegration()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IntegrationSettingsFormValues>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: { enabled: false, settingsText: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        enabled: config?.enabled ?? false,
        settingsText: config?.settings ? JSON.stringify(config.settings, null, 2) : '',
      })
    }
  }, [open, config, reset])

  async function onSubmit(values: IntegrationSettingsFormValues) {
    const settings = values.settingsText ? (JSON.parse(values.settingsText) as Record<string, unknown>) : undefined
    await upsertIntegration
      .mutateAsync({ provider, input: { enabled: values.enabled, settings } }, { onSuccess: onClose })
      .catch(() => undefined)
  }

  return (
    <Modal
      title={`Edit settings — ${provider}`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={upsertIntegration.isPending}
      okText="Save"
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Enabled">
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
          />
        </Form.Item>

        <Form.Item
          label="Settings (JSON)"
          validateStatus={errors.settingsText ? 'error' : ''}
          help={errors.settingsText?.message ?? 'Stored as-is — no live call is ever made to this provider.'}
        >
          <Controller
            name="settingsText"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} rows={8} placeholder={'{\n  "apiKey": "..."\n}'} style={{ fontFamily: 'monospace' }} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
