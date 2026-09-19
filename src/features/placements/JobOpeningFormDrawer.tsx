import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import { jobOpeningSchema, type JobOpeningFormValues } from '@/features/placements/jobOpeningSchema'
import { useCompaniesQuery, useCreateJobOpening } from '@/features/placements/hooks'

interface JobOpeningFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: JobOpeningFormValues = {
  companyId: '',
  title: '',
  description: '',
  minCgpa: undefined,
  ctcOffered: undefined,
  applicationDeadline: undefined,
}

export function JobOpeningFormDrawer({ open, onClose }: JobOpeningFormDrawerProps) {
  const createJobOpening = useCreateJobOpening()
  const companiesQuery = useCompaniesQuery()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobOpeningFormValues>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) reset(emptyValues)
  }, [open, reset])

  async function onSubmit(values: JobOpeningFormValues) {
    const input = {
      ...values,
      description: values.description || undefined,
      minCgpa: values.minCgpa ?? undefined,
      ctcOffered: values.ctcOffered ?? undefined,
      applicationDeadline: values.applicationDeadline || undefined,
    }
    // Error surfaces via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createJobOpening.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Add job opening"
      open={open}
      onClose={onClose}
      size={480}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createJobOpening.isPending} onClick={handleSubmit(onSubmit)}>
            Add opening
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Company" validateStatus={errors.companyId ? 'error' : ''} help={errors.companyId?.message}>
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={companiesQuery.isPending}
                options={(companiesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select company"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Title" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>

        <Form.Item label="Description">
          <Controller name="description" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
        </Form.Item>

        <Form.Item label="Minimum CGPA" validateStatus={errors.minCgpa ? 'error' : ''} help={errors.minCgpa?.message}>
          <Controller
            name="minCgpa"
            control={control}
            render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} max={10} step={0.1} />}
          />
        </Form.Item>

        <Form.Item label="CTC offered" validateStatus={errors.ctcOffered ? 'error' : ''} help={errors.ctcOffered?.message}>
          <Controller
            name="ctcOffered"
            control={control}
            render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} addonAfter="LPA" />}
          />
        </Form.Item>

        <Form.Item label="Application deadline">
          <Controller
            name="applicationDeadline"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
