import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Space } from 'antd'
import { hostelSchema, type HostelFormValues } from '@/features/hostel/hostelSchema'
import { useCreateHostel } from '@/features/hostel/hooks'

interface HostelFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: HostelFormValues = { name: '' }

export function HostelFormDrawer({ open, onClose }: HostelFormDrawerProps) {
  const createHostel = useCreateHostel()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostelFormValues>({
    resolver: zodResolver(hostelSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: HostelFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createHostel.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add hostel"
      open={open}
      onClose={handleClose}
      size={360}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createHostel.isPending} onClick={handleSubmit(onSubmit)}>
            Add hostel
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Boys Hostel A" />} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
