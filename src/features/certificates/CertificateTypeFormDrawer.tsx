import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Space } from 'antd'
import { certificateTypeSchema, type CertificateTypeFormValues } from '@/features/certificates/certificateTypeSchema'
import { useCreateCertificateType } from '@/features/certificates/hooks'

interface CertificateTypeFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: CertificateTypeFormValues = {
  name: '',
  category: '',
}

export function CertificateTypeFormDrawer({ open, onClose }: CertificateTypeFormDrawerProps) {
  const createCertificateType = useCreateCertificateType()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CertificateTypeFormValues>({
    resolver: zodResolver(certificateTypeSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: CertificateTypeFormValues) {
    const input = { ...values, category: values.category || undefined }
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createCertificateType.mutateAsync(input, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add certificate type"
      open={open}
      onClose={handleClose}
      size={400}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createCertificateType.isPending} onClick={handleSubmit(onSubmit)}>
            Create
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Bonafide Certificate" />} />
        </Form.Item>

        <Form.Item label="Category" validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
          <Controller name="category" control={control} render={({ field }) => <Input {...field} placeholder="Optional" />} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
