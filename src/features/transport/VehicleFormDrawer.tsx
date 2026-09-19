import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Space } from 'antd'
import { vehicleSchema, type VehicleFormValues } from '@/features/transport/transportSchema'
import { useCreateVehicle } from '@/features/transport/hooks'

interface VehicleFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: VehicleFormValues = {
  registrationNumber: '',
  driverName: '',
  driverPhone: '',
  capacity: 1,
}

export function VehicleFormDrawer({ open, onClose }: VehicleFormDrawerProps) {
  const createVehicle = useCreateVehicle()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: VehicleFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createVehicle.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add vehicle"
      open={open}
      onClose={handleClose}
      size={400}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createVehicle.isPending} onClick={handleSubmit(onSubmit)}>
            Add vehicle
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item
          label="Registration number"
          validateStatus={errors.registrationNumber ? 'error' : ''}
          help={errors.registrationNumber?.message}
        >
          <Controller
            name="registrationNumber"
            control={control}
            render={({ field }) => <Input {...field} placeholder="KA-01-AB-1234" />}
          />
        </Form.Item>

        <Form.Item label="Driver name" validateStatus={errors.driverName ? 'error' : ''} help={errors.driverName?.message}>
          <Controller name="driverName" control={control} render={({ field }) => <Input {...field} placeholder="Ramesh Kumar" />} />
        </Form.Item>

        <Form.Item label="Driver phone" validateStatus={errors.driverPhone ? 'error' : ''} help={errors.driverPhone?.message}>
          <Controller name="driverPhone" control={control} render={({ field }) => <Input {...field} placeholder="9876543210" />} />
        </Form.Item>

        <Form.Item label="Capacity" validateStatus={errors.capacity ? 'error' : ''} help={errors.capacity?.message}>
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={1}
                max={100}
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
