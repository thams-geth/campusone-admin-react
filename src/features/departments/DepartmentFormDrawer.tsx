import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, Select, Space } from 'antd'
import type { Department } from '@/types/department'
import { departmentSchema, type DepartmentFormValues } from '@/features/departments/departmentSchema'
import { useCreateDepartment, useUpdateDepartment } from '@/features/departments/hooks'

interface DepartmentFormDrawerProps {
  open: boolean
  onClose: () => void
  department?: Department
}

const emptyValues: DepartmentFormValues = {
  name: '',
  code: '',
  headOfDepartment: '',
  description: '',
  status: 'active',
}

export function DepartmentFormDrawer({ open, onClose, department }: DepartmentFormDrawerProps) {
  const isEditing = !!department
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const submitting = createDepartment.isPending || updateDepartment.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        department
          ? {
              name: department.name,
              code: department.code,
              headOfDepartment: department.headOfDepartment ?? '',
              description: department.description ?? '',
              status: department.status,
            }
          : emptyValues,
      )
    }
  }, [open, department, reset])

  async function onSubmit(values: DepartmentFormValues) {
    const input = {
      ...values,
      headOfDepartment: values.headOfDepartment || undefined,
      description: values.description || undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (department) {
      await updateDepartment.mutateAsync({ id: department.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createDepartment.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit department' : 'Add department'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create department'}
          </Button>
        </Space>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Computer Science & Engineering" />}
          />
        </Form.Item>

        <Form.Item label="Code" validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} placeholder="CSE" style={{ textTransform: 'uppercase' }} />}
          />
        </Form.Item>

        <Form.Item
          label="Head of department"
          validateStatus={errors.headOfDepartment ? 'error' : ''}
          help={errors.headOfDepartment?.message}
        >
          <Controller
            name="headOfDepartment"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Dr. Jane Doe" />}
          />
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

        <Form.Item label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            )}
          />
        </Form.Item>
      </form>
    </Drawer>
  )
}
