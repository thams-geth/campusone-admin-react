import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Program } from '@/services/api/programsApi'
import { programSchema, PROGRAM_STATUS_OPTIONS, type ProgramFormValues } from '@/features/programs/programSchema'
import { useAllDepartmentsForPrograms, useCreateProgram, useUpdateProgram } from '@/features/programs/hooks'

interface ProgramFormDrawerProps {
  open: boolean
  onClose: () => void
  program?: Program
}

const emptyValues: ProgramFormValues = {
  departmentId: '',
  name: '',
  code: '',
  durationYears: 4,
  status: 'ACTIVE',
}

export function ProgramFormDrawer({ open, onClose, program }: ProgramFormDrawerProps) {
  const isEditing = !!program
  const departmentsQuery = useAllDepartmentsForPrograms()
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const submitting = createProgram.isPending || updateProgram.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        program
          ? {
              departmentId: program.departmentId,
              name: program.name,
              code: program.code,
              durationYears: program.durationYears,
              status: program.status,
            }
          : emptyValues,
      )
    }
  }, [open, program, reset])

  async function onSubmit(values: ProgramFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (program) {
      await updateProgram.mutateAsync({ id: program.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createProgram.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit program' : 'Add program'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create program'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Department" validateStatus={errors.departmentId ? 'error' : ''} help={errors.departmentId?.message}>
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={departmentsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select department"
                options={(departmentsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Bachelor of Technology" />}
          />
        </Form.Item>

        <Form.Item label="Code" validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} placeholder="BTECH-CSE" style={{ textTransform: 'uppercase' }} />}
          />
        </Form.Item>

        <Form.Item
          label="Duration (years)"
          validateStatus={errors.durationYears ? 'error' : ''}
          help={errors.durationYears?.message}
        >
          <Controller
            name="durationYears"
            control={control}
            render={({ field }) => <InputNumber {...field} min={1} max={10} style={{ width: '100%' }} />}
          />
        </Form.Item>

        <Form.Item label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => <Select {...field} options={[...PROGRAM_STATUS_OPTIONS]} />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
