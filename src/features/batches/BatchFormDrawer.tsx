import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Batch } from '@/services/api/batchesApi'
import { batchSchema, type BatchFormValues } from '@/features/batches/batchSchema'
import { useAllAcademicYearsForBatches, useAllProgramsForBatches, useCreateBatch, useUpdateBatch } from '@/features/batches/hooks'

interface BatchFormDrawerProps {
  open: boolean
  onClose: () => void
  batch?: Batch
}

const emptyValues: BatchFormValues = {
  programId: '',
  academicYearId: '',
  name: '',
  startYear: new Date().getFullYear(),
  endYear: new Date().getFullYear() + 1,
  status: 'ACTIVE',
}

export function BatchFormDrawer({ open, onClose, batch }: BatchFormDrawerProps) {
  const isEditing = !!batch
  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch()
  const programsQuery = useAllProgramsForBatches()
  const academicYearsQuery = useAllAcademicYearsForBatches()
  const submitting = createBatch.isPending || updateBatch.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        batch
          ? {
              programId: batch.programId,
              academicYearId: batch.academicYearId,
              name: batch.name,
              startYear: batch.startYear,
              endYear: batch.endYear,
              status: batch.status,
            }
          : emptyValues,
      )
    }
  }, [open, batch, reset])

  async function onSubmit(values: BatchFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (batch) {
      await updateBatch.mutateAsync({ id: batch.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createBatch.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit batch' : 'Add batch'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create batch'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Program" validateStatus={errors.programId ? 'error' : ''} help={errors.programId?.message}>
          <Controller
            name="programId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select program"
                loading={programsQuery.isPending}
                options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Academic year"
          validateStatus={errors.academicYearId ? 'error' : ''}
          help={errors.academicYearId?.message}
        >
          <Controller
            name="academicYearId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select academic year"
                loading={academicYearsQuery.isPending}
                options={(academicYearsQuery.data?.data ?? []).map((y) => ({ value: y.id, label: y.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Batch 2024-28" />} />
        </Form.Item>

        <Form.Item label="Start year" validateStatus={errors.startYear ? 'error' : ''} help={errors.startYear?.message}>
          <Controller
            name="startYear"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={2000}
                max={2100}
                style={{ width: '100%' }}
                onChange={(value) => field.onChange(value ?? emptyValues.startYear)}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="End year" validateStatus={errors.endYear ? 'error' : ''} help={errors.endYear?.message}>
          <Controller
            name="endYear"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={2000}
                max={2100}
                style={{ width: '100%' }}
                onChange={(value) => field.onChange(value ?? emptyValues.endYear)}
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
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'GRADUATED', label: 'Graduated' },
                ]}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
