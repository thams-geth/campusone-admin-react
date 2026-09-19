import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import { admissionApplicationSchema, type AdmissionApplicationFormValues } from '@/features/admissions/admissionSchema'
import { useAllPrograms, useCreateAdmissionApplication } from '@/features/admissions/hooks'

interface AdmissionApplicationFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: AdmissionApplicationFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  programId: '',
}

export function AdmissionApplicationFormDrawer({ open, onClose }: AdmissionApplicationFormDrawerProps) {
  const createAdmissionApplication = useCreateAdmissionApplication()
  const programsQuery = useAllPrograms()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdmissionApplicationFormValues>({
    resolver: zodResolver(admissionApplicationSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) reset(emptyValues)
  }, [open, reset])

  async function onSubmit(values: AdmissionApplicationFormValues) {
    // Error surfaces via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createAdmissionApplication.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="New application"
      open={open}
      onClose={onClose}
      size={480}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createAdmissionApplication.isPending} onClick={handleSubmit(onSubmit)}>
            Submit application
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="First name" validateStatus={errors.firstName ? 'error' : ''} help={errors.firstName?.message}>
          <Controller name="firstName" control={control} render={({ field }) => <Input {...field} placeholder="Asha" />} />
        </Form.Item>

        <Form.Item label="Last name" validateStatus={errors.lastName ? 'error' : ''} help={errors.lastName?.message}>
          <Controller name="lastName" control={control} render={({ field }) => <Input {...field} placeholder="Rao" />} />
        </Form.Item>

        <Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} type="email" placeholder="asha.rao@example.com" />}
          />
        </Form.Item>

        <Form.Item label="Phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <Input {...field} placeholder="+91 9000000000" />}
          />
        </Form.Item>

        <Form.Item
          label="Date of birth"
          validateStatus={errors.dateOfBirth ? 'error' : ''}
          help={errors.dateOfBirth?.message}
        >
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                maxDate={dayjs()}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Program" validateStatus={errors.programId ? 'error' : ''} help={errors.programId?.message}>
          <Controller
            name="programId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={programsQuery.isPending}
                options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select program"
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
