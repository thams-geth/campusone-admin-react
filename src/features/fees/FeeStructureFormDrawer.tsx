import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, InputNumber, Select, Space } from 'antd'
import type { FeeCategory } from '@/services/api/feesApi'
import { feeStructureSchema, type FeeStructureFormValues } from '@/features/fees/feesSchema'
import { useAllAcademicYearsForFees, useAllProgramsForFees, useCreateFeeStructure } from '@/features/fees/hooks'

interface FeeStructureFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: FeeStructureFormValues = {
  programId: '',
  academicYearId: '',
  category: 'TUITION',
  amount: 0,
}

const CATEGORY_OPTIONS: { value: FeeCategory; label: string }[] = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'LIBRARY', label: 'Library' },
  { value: 'LAB', label: 'Lab' },
  { value: 'OTHER', label: 'Other' },
]

export function FeeStructureFormDrawer({ open, onClose }: FeeStructureFormDrawerProps) {
  const createFeeStructure = useCreateFeeStructure()
  const programsQuery = useAllProgramsForFees()
  const academicYearsQuery = useAllAcademicYearsForFees()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: FeeStructureFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createFeeStructure.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="New fee structure"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createFeeStructure.isPending} onClick={handleSubmit(onSubmit)}>
            Create
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
                showSearch
                loading={programsQuery.isPending}
                placeholder="Select program"
                optionFilterProp="label"
                options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
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
                loading={academicYearsQuery.isPending}
                placeholder="Select academic year"
                options={(academicYearsQuery.data?.data ?? []).map((y) => ({ value: y.id, label: y.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Category" validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => <Select {...field} options={CATEGORY_OPTIONS} />}
          />
        </Form.Item>

        <Form.Item label="Amount" validateStatus={errors.amount ? 'error' : ''} help={errors.amount?.message}>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
                value={field.value}
                onChange={(value) => field.onChange(value ?? 0)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
