import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Flex, Form, Input, Space } from 'antd'
import type { Institution } from '@/services/api/institutionApi'
import { institutionSchema, type InstitutionFormValues } from '@/features/institution/institutionSchema'
import { useUpdateInstitution } from '@/features/institution/hooks'

interface InstitutionEditDrawerProps {
  open: boolean
  onClose: () => void
  institution: Institution
}

export function InstitutionEditDrawer({ open, onClose, institution }: InstitutionEditDrawerProps) {
  const updateInstitution = useUpdateInstitution()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionSchema),
    defaultValues: { name: institution.name, primaryColor: institution.primaryColor ?? '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: institution.name, primaryColor: institution.primaryColor ?? '' })
    }
  }, [open, institution, reset])

  async function onSubmit(values: InstitutionFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await updateInstitution
      .mutateAsync({ name: values.name, primaryColor: values.primaryColor }, { onSuccess: onClose })
      .catch(() => undefined)
  }

  return (
    <Drawer
      title="Edit institution"
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={updateInstitution.isPending} onClick={handleSubmit(onSubmit)}>
            Save changes
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Demo College" />} />
        </Form.Item>

        <Form.Item
          label="Primary color"
          validateStatus={errors.primaryColor ? 'error' : ''}
          help={errors.primaryColor?.message ?? 'Hex color like #1677FF. Leave blank to clear.'}
        >
          <Controller
            name="primaryColor"
            control={control}
            render={({ field }) => (
              <Flex gap={8} align="center">
                <span
                  style={{
                    display: 'inline-block',
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.15)',
                    background: /^#[0-9A-Fa-f]{6}$/.test(field.value) ? field.value : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <Input {...field} placeholder="#1677FF" style={{ flex: 1 }} />
              </Flex>
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
