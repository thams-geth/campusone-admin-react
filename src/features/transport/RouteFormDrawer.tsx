import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Select, Space } from 'antd'
import type { Vehicle } from '@/services/api/transportApi'
import { routeSchema, type RouteFormValues } from '@/features/transport/transportSchema'
import { useCreateRoute } from '@/features/transport/hooks'

interface RouteFormDrawerProps {
  open: boolean
  onClose: () => void
  vehicles: Vehicle[]
}

const emptyValues: RouteFormValues = { name: '', vehicleId: undefined }

export function RouteFormDrawer({ open, onClose, vehicles }: RouteFormDrawerProps) {
  const createRoute = useCreateRoute()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: RouteFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createRoute.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add route"
      open={open}
      onClose={handleClose}
      size={400}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createRoute.isPending} onClick={handleSubmit(onSubmit)}>
            Add route
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Route 1 — City Center" />} />
        </Form.Item>

        <Form.Item label="Vehicle" help="Optional — can be assigned later">
          <Controller
            name="vehicleId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                allowClear
                placeholder="Select vehicle"
                options={vehicles.map((v) => ({ value: v.id, label: v.registrationNumber }))}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
