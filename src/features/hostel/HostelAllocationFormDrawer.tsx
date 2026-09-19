import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Select, Space } from 'antd'
import type { HostelRoom } from '@/services/api/hostelApi'
import { hostelAllocationSchema, type HostelAllocationFormValues } from '@/features/hostel/hostelSchema'
import { useAllStudentsForHostel, useCreateHostelAllocation } from '@/features/hostel/hooks'

interface HostelAllocationFormDrawerProps {
  open: boolean
  onClose: () => void
  rooms: HostelRoom[]
}

const emptyValues: HostelAllocationFormValues = { studentId: '', hostelRoomId: '', startDate: '' }

export function HostelAllocationFormDrawer({ open, onClose, rooms }: HostelAllocationFormDrawerProps) {
  const createHostelAllocation = useCreateHostelAllocation()
  const studentsQuery = useAllStudentsForHostel()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostelAllocationFormValues>({
    resolver: zodResolver(hostelAllocationSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: HostelAllocationFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createHostelAllocation.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Allocate student"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createHostelAllocation.isPending} onClick={handleSubmit(onSubmit)}>
            Allocate
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

        <Form.Item label="Room" validateStatus={errors.hostelRoomId ? 'error' : ''} help={errors.hostelRoomId?.message}>
          <Controller
            name="hostelRoomId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                placeholder="Select room"
                optionFilterProp="label"
                options={rooms.map((r) => ({ value: r.id, label: `${r.roomNumber} (capacity ${r.capacity})` }))}
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
      </Form>
    </Drawer>
  )
}
