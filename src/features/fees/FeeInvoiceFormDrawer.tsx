import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, InputNumber, Select, Space } from 'antd'
import type { FeeCategory } from '@/services/api/feesApi'
import { feeInvoiceSchema, type FeeInvoiceFormValues } from '@/features/fees/feesSchema'
import { useAllFeeStructuresForFees, useAllStudentsForFees, useCreateFeeInvoice } from '@/features/fees/hooks'

interface FeeInvoiceFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: FeeInvoiceFormValues = {
  studentId: '',
  feeStructureId: undefined,
  category: 'TUITION',
  amount: 0,
  dueDate: '',
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

export function FeeInvoiceFormDrawer({ open, onClose }: FeeInvoiceFormDrawerProps) {
  const createFeeInvoice = useCreateFeeInvoice()
  const studentsQuery = useAllStudentsForFees()
  const feeStructuresQuery = useAllFeeStructuresForFees()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeeInvoiceFormValues>({
    resolver: zodResolver(feeInvoiceSchema),
    defaultValues: emptyValues,
  })

  const feeStructureId = useWatch({ control, name: 'feeStructureId' })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  function handleFeeStructureChange(value: string | undefined) {
    setValue('feeStructureId', value)
    const structure = feeStructuresQuery.data?.data.find((s) => s.id === value)
    if (structure) {
      setValue('category', structure.category)
      setValue('amount', structure.amount)
    }
  }

  async function onSubmit(values: FeeInvoiceFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createFeeInvoice.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="New invoice"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createFeeInvoice.isPending} onClick={handleSubmit(onSubmit)}>
            Create invoice
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

        <Form.Item label="Fee structure" help="Optional — selecting one fills in category and amount">
          <Select
            allowClear
            loading={feeStructuresQuery.isPending}
            placeholder="Select fee structure (optional)"
            value={feeStructureId}
            onChange={handleFeeStructureChange}
            options={(feeStructuresQuery.data?.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.category} — ₹${s.amount.toLocaleString()}`,
            }))}
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

        <Form.Item label="Due date" validateStatus={errors.dueDate ? 'error' : ''} help={errors.dueDate?.message}>
          <Controller
            name="dueDate"
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
