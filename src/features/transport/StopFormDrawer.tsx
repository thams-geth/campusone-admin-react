import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Space } from 'antd'
import { stopSchema, type StopFormValues } from '@/features/transport/transportSchema'
import { useAddStop } from '@/features/transport/hooks'

interface StopFormDrawerProps {
  open: boolean
  onClose: () => void
  routeId: string | undefined
  routeName?: string
  /** Next free sequence number for this route, used as the default. */
  nextSequence: number
}

export function StopFormDrawer({ open, onClose, routeId, routeName, nextSequence }: StopFormDrawerProps) {
  const addStop = useAddStop()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: { name: '', sequence: nextSequence },
  })

  useEffect(() => {
    if (open) reset({ name: '', sequence: nextSequence })
  }, [open, routeId, nextSequence, reset])

  function handleClose() {
    reset({ name: '', sequence: nextSequence })
    onClose()
  }

  async function onSubmit(values: StopFormValues) {
    if (!routeId) return
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await addStop.mutateAsync({ routeId, input: values }, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title={routeName ? `Add stop — ${routeName}` : 'Add stop'}
      open={open}
      onClose={handleClose}
      size={360}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={addStop.isPending} onClick={handleSubmit(onSubmit)}>
            Add stop
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Stop name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Gandhi Nagar" />} />
        </Form.Item>

        <Form.Item label="Sequence" validateStatus={errors.sequence ? 'error' : ''} help={errors.sequence?.message}>
          <Controller
            name="sequence"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={1}
                max={200}
                style={{ width: '100%' }}
                onChange={(value) => field.onChange(value ?? 1)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
