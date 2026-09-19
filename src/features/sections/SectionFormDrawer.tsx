import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Section } from '@/services/api/sectionsApi'
import { sectionSchema, type SectionFormValues } from '@/features/sections/sectionSchema'
import { useAllBatchesForSections, useCreateSection, useUpdateSection } from '@/features/sections/hooks'

interface SectionFormDrawerProps {
  open: boolean
  onClose: () => void
  section?: Section
}

const emptyValues: SectionFormValues = {
  batchId: '',
  name: '',
  currentSemester: 1,
  capacity: undefined,
  status: 'ACTIVE',
}

export function SectionFormDrawer({ open, onClose, section }: SectionFormDrawerProps) {
  const isEditing = !!section
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const batchesQuery = useAllBatchesForSections()
  const submitting = createSection.isPending || updateSection.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        section
          ? {
              batchId: section.batchId,
              name: section.name,
              currentSemester: section.currentSemester,
              capacity: section.capacity ?? undefined,
              status: section.status,
            }
          : emptyValues,
      )
    }
  }, [open, section, reset])

  async function onSubmit(values: SectionFormValues) {
    const input = { ...values, capacity: values.capacity ?? undefined }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (section) {
      await updateSection.mutateAsync({ id: section.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createSection.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit section' : 'Add section'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create section'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Batch" validateStatus={errors.batchId ? 'error' : ''} help={errors.batchId?.message}>
          <Controller
            name="batchId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select batch"
                loading={batchesQuery.isPending}
                options={(batchesQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Section A" />} />
        </Form.Item>

        <Form.Item
          label="Current semester"
          validateStatus={errors.currentSemester ? 'error' : ''}
          help={errors.currentSemester?.message}
        >
          <Controller
            name="currentSemester"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={1}
                max={12}
                style={{ width: '100%' }}
                onChange={(value) => field.onChange(value ?? emptyValues.currentSemester)}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Capacity" validateStatus={errors.capacity ? 'error' : ''} help={errors.capacity?.message}>
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} style={{ width: '100%' }} placeholder="Optional" />
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
