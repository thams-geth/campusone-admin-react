import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import { leaveRequestSchema, type LeaveRequestFormValues } from '@/features/leave/leaveSchema'
import { useAllStudentsForLeave, useCreateLeaveRequest, useLeaveTypesQuery } from '@/features/leave/hooks'

interface LeaveRequestFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: LeaveRequestFormValues = {
  studentId: '',
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
}

export function LeaveRequestFormDrawer({ open, onClose }: LeaveRequestFormDrawerProps) {
  const createLeaveRequest = useCreateLeaveRequest()
  const studentsQuery = useAllStudentsForLeave()
  const leaveTypesQuery = useLeaveTypesQuery()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: LeaveRequestFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createLeaveRequest.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="New leave request"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createLeaveRequest.isPending} onClick={handleSubmit(onSubmit)}>
            Submit request
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Student" validateStatus={errors.studentId ? 'error' : ''} help={errors.studentId?.message}>
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={studentsQuery.isPending}
                placeholder="Select student"
                optionFilterProp="label"
                options={(studentsQuery.data?.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
                }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Leave type"
          validateStatus={errors.leaveTypeId ? 'error' : ''}
          help={errors.leaveTypeId?.message}
        >
          <Controller
            name="leaveTypeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={leaveTypesQuery.isPending}
                placeholder="Select leave type"
                options={(leaveTypesQuery.data?.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Start date" validateStatus={errors.startDate ? 'error' : ''} help={errors.startDate?.message}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="End date" validateStatus={errors.endDate ? 'error' : ''} help={errors.endDate?.message}>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Reason" validateStatus={errors.reason ? 'error' : ''} help={errors.reason?.message}>
          <Controller name="reason" control={control} render={({ field }) => <Input.TextArea {...field} rows={4} />} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
