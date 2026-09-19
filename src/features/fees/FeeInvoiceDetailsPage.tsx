import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type {
  FeeAdjustment,
  FeeCategory,
  FeeInvoiceStatus,
  Payment,
  PaymentMethod,
} from '@/services/api/feesApi'
import {
  adjustmentSchema,
  paymentSchema,
  refundSchema,
  type AdjustmentFormValues,
  type PaymentFormValues,
  type RefundFormValues,
} from '@/features/fees/feesSchema'
import {
  useAddAdjustment,
  useAllStudentsForFees,
  useFeeInvoiceQuery,
  useRecordPayment,
  useRefundPayment,
  useWaiveInvoice,
} from '@/features/fees/hooks'
import { formatDateTime } from '@/utils/formatDate'

const STATUS_COLOR: Record<FeeInvoiceStatus, string> = {
  PENDING: 'gold',
  PARTIAL: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  WAIVED: 'default',
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
]

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: 'DISCOUNT', label: 'Discount' },
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'FINE', label: 'Fine' },
]

const emptyPaymentValues: PaymentFormValues = { amount: 0, method: 'CASH', transactionRef: undefined }
const emptyAdjustmentValues: AdjustmentFormValues = { type: 'DISCOUNT', amount: 0, reason: '' }
const emptyRefundValues: RefundFormValues = { amount: 0, reason: '' }

function RecordPaymentModal({
  open,
  onClose,
  invoiceId,
}: {
  open: boolean
  onClose: () => void
  invoiceId: string
}) {
  const recordPayment = useRecordPayment(invoiceId)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema), defaultValues: emptyPaymentValues })

  function handleClose() {
    reset(emptyPaymentValues)
    onClose()
  }

  async function onSubmit(values: PaymentFormValues) {
    await recordPayment.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Modal
      title="Record payment"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={recordPayment.isPending}
      okText="Record payment"
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
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
        <Form.Item label="Method" validateStatus={errors.method ? 'error' : ''} help={errors.method?.message}>
          <Controller
            name="method"
            control={control}
            render={({ field }) => <Select {...field} options={METHOD_OPTIONS} />}
          />
        </Form.Item>
        <Form.Item label="Transaction reference" help="Optional">
          <Controller
            name="transactionRef"
            control={control}
            render={({ field }) => <Input {...field} placeholder="e.g. UPI ref / cheque no." />}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function AddAdjustmentModal({
  open,
  onClose,
  invoiceId,
}: {
  open: boolean
  onClose: () => void
  invoiceId: string
}) {
  const addAdjustment = useAddAdjustment(invoiceId)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({ resolver: zodResolver(adjustmentSchema), defaultValues: emptyAdjustmentValues })

  function handleClose() {
    reset(emptyAdjustmentValues)
    onClose()
  }

  async function onSubmit(values: AdjustmentFormValues) {
    await addAdjustment.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Modal
      title="Add adjustment"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={addAdjustment.isPending}
      okText="Add adjustment"
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Type" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => <Select {...field} options={ADJUSTMENT_TYPE_OPTIONS} />}
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
        <Form.Item label="Reason" validateStatus={errors.reason ? 'error' : ''} help={errors.reason?.message}>
          <Controller name="reason" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function RefundPaymentModal({
  open,
  onClose,
  invoiceId,
  payment,
}: {
  open: boolean
  onClose: () => void
  invoiceId: string
  payment: Payment | undefined
}) {
  const refundPayment = useRefundPayment(invoiceId)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefundFormValues>({ resolver: zodResolver(refundSchema), defaultValues: emptyRefundValues })

  function handleClose() {
    reset(emptyRefundValues)
    onClose()
  }

  async function onSubmit(values: RefundFormValues) {
    if (!payment) return
    await refundPayment
      .mutateAsync({ paymentId: payment.id, input: values }, { onSuccess: handleClose })
      .catch(() => undefined)
  }

  return (
    <Modal
      title="Refund payment"
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={refundPayment.isPending}
      okText="Refund"
      okButtonProps={{ danger: true }}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Amount" validateStatus={errors.amount ? 'error' : ''} help={errors.amount?.message}>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
                max={payment?.amount}
                value={field.value}
                onChange={(value) => field.onChange(value ?? 0)}
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Reason" validateStatus={errors.reason ? 'error' : ''} help={errors.reason?.message}>
          <Controller name="reason" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export function FeeInvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceQuery = useFeeInvoiceQuery(id)
  const studentsQuery = useAllStudentsForFees()
  const waiveInvoice = useWaiveInvoice(id)

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
  const [refundingPayment, setRefundingPayment] = useState<Payment | undefined>(undefined)

  const student = useMemo(
    () => studentsQuery.data?.data.find((s) => s.id === invoiceQuery.data?.studentId),
    [studentsQuery.data, invoiceQuery.data],
  )

  if (invoiceQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Invoice not found.</Typography.Text>
      </Card>
    )
  }

  const invoice = invoiceQuery.data

  const paymentColumns: TableProps<Payment>['columns'] = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      render: (value: number, record) => (record.isRefund ? `-₹${value.toLocaleString()}` : `₹${value.toLocaleString()}`),
    },
    { title: 'Method', dataIndex: 'method', render: (value: PaymentMethod) => <Tag>{value}</Tag> },
    {
      title: 'Refund',
      dataIndex: 'isRefund',
      render: (value: boolean) => (value ? <Tag color="red">Refund</Tag> : <Tag color="green">Payment</Tag>),
    },
    { title: 'Transaction ref', dataIndex: 'transactionRef', render: (value: string | null) => value ?? '—' },
    { title: 'Date', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        !record.isRefund ? (
          <Button size="small" onClick={() => setRefundingPayment(record)}>
            Refund
          </Button>
        ) : null,
    },
  ]

  const adjustmentColumns: TableProps<FeeAdjustment>['columns'] = [
    { title: 'Type', dataIndex: 'type', render: (value: string) => <Tag>{value}</Tag> },
    { title: 'Amount', dataIndex: 'amount', render: (value: number) => `₹${value.toLocaleString()}` },
    { title: 'Reason', dataIndex: 'reason' },
    { title: 'Date', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Invoice details
        </Typography.Title>
        <Space>
          {invoice.status !== 'WAIVED' && (
            <>
              <Button onClick={() => setPaymentModalOpen(true)}>Record payment</Button>
              <Button onClick={() => setAdjustmentModalOpen(true)}>Add adjustment</Button>
              <Popconfirm
                title="Waive invoice"
                description="This marks the invoice as fully waived. This cannot be undone."
                onConfirm={() => waiveInvoice.mutateAsync().catch(() => undefined)}
                okText="Waive"
                okButtonProps={{ danger: true }}
              >
                <Button danger>Waive</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Flex>

      <Card>
        <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {student ? `${student.firstName} ${student.lastName} (${student.rollNumber})` : invoice.studentId}
            </Typography.Title>
            <Tag color={STATUS_COLOR[invoice.status]}>{invoice.status}</Tag>
          </div>
        </Flex>

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Category">
            <Tag>{invoice.category as FeeCategory}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">₹{invoice.amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Due date">{new Date(invoice.dueDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLOR[invoice.status]}>{invoice.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Payments" style={{ marginTop: 16 }}>
        <Table<Payment>
          rowKey="id"
          columns={paymentColumns}
          dataSource={invoice.payments ?? []}
          pagination={false}
        />
      </Card>

      <Card title="Adjustments" style={{ marginTop: 16 }}>
        <Table<FeeAdjustment>
          rowKey="id"
          columns={adjustmentColumns}
          dataSource={invoice.adjustments ?? []}
          pagination={false}
        />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/fees">&larr; Back to fees</Link>
      </div>

      <RecordPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} invoiceId={invoice.id} />
      <AddAdjustmentModal
        open={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        invoiceId={invoice.id}
      />
      <RefundPaymentModal
        open={!!refundingPayment}
        onClose={() => setRefundingPayment(undefined)}
        invoiceId={invoice.id}
        payment={refundingPayment}
      />
    </div>
  )
}
