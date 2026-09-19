import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import type { ActivityType, StudentActivity } from '@/services/api/activitiesApi'
import { activitySchema, type ActivityFormValues } from '@/features/activities/activitySchema'
import { useAllStudentsForActivities, useCreateActivity, useUpdateActivity } from '@/features/activities/hooks'

interface ActivityFormDrawerProps {
  open: boolean
  onClose: () => void
  activity?: StudentActivity
}

const emptyValues: ActivityFormValues = {
  studentId: '',
  type: 'ACHIEVEMENT',
  title: '',
  description: '',
  date: '',
  certificateUrl: '',
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'EVENT', label: 'Event' },
  { value: 'CLUB', label: 'Club' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'OTHER', label: 'Other' },
]

export function ActivityFormDrawer({ open, onClose, activity }: ActivityFormDrawerProps) {
  const isEditing = !!activity
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const submitting = createActivity.isPending || updateActivity.isPending
  const studentsQuery = useAllStudentsForActivities()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        activity
          ? {
              studentId: activity.studentId,
              type: activity.type,
              title: activity.title,
              description: activity.description ?? '',
              date: activity.date,
              certificateUrl: activity.certificateUrl ?? '',
            }
          : emptyValues,
      )
    }
  }, [open, activity, reset])

  async function onSubmit(values: ActivityFormValues) {
    const input = {
      ...values,
      description: values.description || undefined,
      certificateUrl: values.certificateUrl || undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (activity) {
      await updateActivity.mutateAsync({ id: activity.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createActivity.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit activity' : 'Add activity'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add activity'}
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

        <Form.Item label="Type" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
          <Controller name="type" control={control} render={({ field }) => <Select {...field} options={TYPE_OPTIONS} />} />
        </Form.Item>

        <Form.Item label="Title" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Controller name="title" control={control} render={({ field }) => <Input {...field} placeholder="State-level Chess Championship" />} />
        </Form.Item>

        <Form.Item
          label="Description"
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Optional" />}
          />
        </Form.Item>

        <Form.Item label="Date" validateStatus={errors.date ? 'error' : ''} help={errors.date?.message}>
          <Controller
            name="date"
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

        <Form.Item
          label="Certificate URL"
          validateStatus={errors.certificateUrl ? 'error' : ''}
          help={errors.certificateUrl?.message}
        >
          <Controller
            name="certificateUrl"
            control={control}
            render={({ field }) => <Input {...field} placeholder="https://... (optional)" />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
