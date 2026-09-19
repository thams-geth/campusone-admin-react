import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, InputNumber, Space } from 'antd'
import { createInvoiceSchema, type CreateInvoiceFormValues } from '@/features/billing/billingSchema'
import { useCreateInvoice } from '@/features/billing/hooks'

interface CreateInvoiceFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: CreateInvoiceFormValues = {
  amount: undefined,
  periodStart: '',
  periodEnd: '',
}

export function CreateInvoiceFormDrawer({ open, onClose }: CreateInvoiceFormDrawerProps) {
  const createInvoice = useCreateInvoice()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: CreateInvoiceFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createInvoice.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Create invoice"
      open={open}
      onClose={handleClose}
      size={420}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createInvoice.isPending} onClick={handleSubmit(onSubmit)}>
            Create invoice
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item
          label="Amount"
          help={errors.amount?.message ?? 'Leave blank to use the plan’s monthly price'}
          validateStatus={errors.amount ? 'error' : ''}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
                placeholder="Plan price"
                value={field.value}
                onChange={(value) => field.onChange(value ?? undefined)}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Period start" validateStatus={errors.periodStart ? 'error' : ''} help={errors.periodStart?.message}>
          <Controller
            name="periodStart"
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

        <Form.Item label="Period end" validateStatus={errors.periodEnd ? 'error' : ''} help={errors.periodEnd?.message}>
          <Controller
            name="periodEnd"
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
