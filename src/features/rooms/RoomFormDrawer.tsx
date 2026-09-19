import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Room } from '@/services/api/roomsApi'
import { roomSchema, type RoomFormValues } from '@/features/rooms/roomSchema'
import { useCreateRoom, useUpdateRoom } from '@/features/rooms/hooks'

interface RoomFormDrawerProps {
  open: boolean
  onClose: () => void
  room?: Room
}

const emptyValues: RoomFormValues = {
  name: '',
  code: '',
  capacity: undefined,
  status: 'ACTIVE',
}

export function RoomFormDrawer({ open, onClose, room }: RoomFormDrawerProps) {
  const isEditing = !!room
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const submitting = createRoom.isPending || updateRoom.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        room
          ? {
              name: room.name,
              code: room.code,
              capacity: room.capacity ?? undefined,
              status: room.status,
            }
          : emptyValues,
      )
    }
  }, [open, room, reset])

  async function onSubmit(values: RoomFormValues) {
    const input = { ...values, capacity: values.capacity ?? undefined }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (room) {
      await updateRoom.mutateAsync({ id: room.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createRoom.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit room' : 'Add room'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create room'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Lecture Hall 1" />}
          />
        </Form.Item>

        <Form.Item label="Code" validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} placeholder="LH-1" style={{ textTransform: 'uppercase' }} />}
          />
        </Form.Item>

        <Form.Item label="Capacity" validateStatus={errors.capacity ? 'error' : ''} help={errors.capacity?.message}>
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} max={2000} style={{ width: '100%' }} placeholder="Optional" />
            )}
          />
        </Form.Item>

        <Form.Item label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
