import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Space } from 'antd'
import type { LeaveType } from '@/services/api/leaveApi'
import { leaveTypeSchema, type LeaveTypeFormValues } from '@/features/leave/leaveSchema'
import { useCreateLeaveType, useUpdateLeaveType } from '@/features/leave/hooks'

interface LeaveTypeFormDrawerProps {
  open: boolean
  onClose: () => void
  leaveType?: LeaveType
}

const emptyValues: LeaveTypeFormValues = {
  name: '',
  defaultDaysPerYear: 0,
}

export function LeaveTypeFormDrawer({ open, onClose, leaveType }: LeaveTypeFormDrawerProps) {
  const isEditing = !!leaveType
  const createLeaveType = useCreateLeaveType()
  const updateLeaveType = useUpdateLeaveType()
  const submitting = createLeaveType.isPending || updateLeaveType.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        leaveType
          ? { name: leaveType.name, defaultDaysPerYear: leaveType.defaultDaysPerYear }
          : emptyValues,
      )
    }
  }, [open, leaveType, reset])

  async function onSubmit(values: LeaveTypeFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (leaveType) {
      await updateLeaveType.mutateAsync({ id: leaveType.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createLeaveType.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit leave type' : 'Add leave type'}
      open={open}
      onClose={onClose}
      size={400}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create leave type'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Sick leave" />} />
        </Form.Item>

        <Form.Item
          label="Default days per year"
          validateStatus={errors.defaultDaysPerYear ? 'error' : ''}
          help={errors.defaultDaysPerYear?.message}
        >
          <Controller
            name="defaultDaysPerYear"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                max={365}
                style={{ width: '100%' }}
                onChange={(value) => field.onChange(value ?? 0)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
