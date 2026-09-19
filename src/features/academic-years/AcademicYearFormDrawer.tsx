import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, Checkbox, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import type { AcademicYear } from '@/services/api/academicYearsApi'
import { academicYearSchema, type AcademicYearFormValues } from '@/features/academic-years/academicYearSchema'
import { useCreateAcademicYear, useUpdateAcademicYear } from '@/features/academic-years/hooks'

interface AcademicYearFormDrawerProps {
  open: boolean
  onClose: () => void
  academicYear?: AcademicYear
}

const emptyValues: AcademicYearFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  status: 'ACTIVE',
}

export function AcademicYearFormDrawer({ open, onClose, academicYear }: AcademicYearFormDrawerProps) {
  const isEditing = !!academicYear
  const createAcademicYear = useCreateAcademicYear()
  const updateAcademicYear = useUpdateAcademicYear()
  const submitting = createAcademicYear.isPending || updateAcademicYear.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        academicYear
          ? {
              name: academicYear.name,
              startDate: academicYear.startDate,
              endDate: academicYear.endDate,
              isCurrent: academicYear.isCurrent,
              status: academicYear.status,
            }
          : emptyValues,
      )
    }
  }, [open, academicYear, reset])

  async function onSubmit(values: AcademicYearFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (academicYear) {
      await updateAcademicYear
        .mutateAsync({ id: academicYear.id, input: values }, { onSuccess: onClose })
        .catch(() => undefined)
    } else {
      await createAcademicYear.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit academic year' : 'Add academic year'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create academic year'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="2026-2027" />}
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
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
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
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
              />
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
                  { value: 'CLOSED', label: 'Closed' },
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Controller
            name="isCurrent"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} {...rest}>
                Set as current academic year
              </Checkbox>
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
