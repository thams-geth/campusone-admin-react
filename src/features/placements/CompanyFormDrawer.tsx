import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Space } from 'antd'
import { companySchema, type CompanyFormValues } from '@/features/placements/companySchema'
import { useCreateCompany } from '@/features/placements/hooks'

interface CompanyFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: CompanyFormValues = { name: '', website: '' }

export function CompanyFormDrawer({ open, onClose }: CompanyFormDrawerProps) {
  const createCompany = useCreateCompany()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) reset(emptyValues)
  }, [open, reset])

  async function onSubmit(values: CompanyFormValues) {
    const input = { ...values, website: values.website || undefined }
    // Error surfaces via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createCompany.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add company"
      open={open}
      onClose={onClose}
      size={420}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createCompany.isPending} onClick={handleSubmit(onSubmit)}>
            Add company
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Acme Corp" />} />
        </Form.Item>

        <Form.Item label="Website" validateStatus={errors.website ? 'error' : ''} help={errors.website?.message}>
          <Controller
            name="website"
            control={control}
            render={({ field }) => <Input {...field} placeholder="https://example.com" />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
