import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Hostel } from '@/services/api/hostelApi'
import { hostelRoomSchema, type HostelRoomFormValues } from '@/features/hostel/hostelSchema'
import { useCreateHostelRoom } from '@/features/hostel/hooks'

interface HostelRoomFormDrawerProps {
  open: boolean
  onClose: () => void
  hostels: Hostel[]
  defaultHostelId?: string
}

function makeEmptyValues(defaultHostelId?: string): HostelRoomFormValues {
  return { hostelId: defaultHostelId ?? '', roomNumber: '', capacity: 1 }
}

export function HostelRoomFormDrawer({ open, onClose, hostels, defaultHostelId }: HostelRoomFormDrawerProps) {
  const createHostelRoom = useCreateHostelRoom()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostelRoomFormValues>({
    resolver: zodResolver(hostelRoomSchema),
    defaultValues: makeEmptyValues(defaultHostelId),
  })

  useEffect(() => {
    if (open) reset(makeEmptyValues(defaultHostelId))
  }, [open, defaultHostelId, reset])

  function handleClose() {
    reset(makeEmptyValues(defaultHostelId))
    onClose()
  }

  async function onSubmit(values: HostelRoomFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createHostelRoom.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add room"
      open={open}
      onClose={handleClose}
      size={400}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createHostelRoom.isPending} onClick={handleSubmit(onSubmit)}>
            Add room
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Hostel" validateStatus={errors.hostelId ? 'error' : ''} help={errors.hostelId?.message}>
          <Controller
            name="hostelId"
            control={control}
            render={({ field }) => (
              <Select {...field} placeholder="Select hostel" options={hostels.map((h) => ({ value: h.id, label: h.name }))} />
            )}
          />
        </Form.Item>

        <Form.Item label="Room number" validateStatus={errors.roomNumber ? 'error' : ''} help={errors.roomNumber?.message}>
          <Controller name="roomNumber" control={control} render={({ field }) => <Input {...field} placeholder="A-101" />} />
        </Form.Item>

        <Form.Item label="Capacity" validateStatus={errors.capacity ? 'error' : ''} help={errors.capacity?.message}>
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={1}
                max={20}
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
