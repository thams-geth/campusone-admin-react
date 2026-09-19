import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Button, Card, Empty, Flex, Form, Input, List, Modal, Popconfirm, Select, Space, Spin, Tag, TimePicker, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { PeriodSlot, PeriodType } from '@/services/api/timetableApi'
import { useCreatePeriodSlot, useDeletePeriodSlot, usePeriodSlotsQuery, useUpdatePeriodSlot } from '@/features/timetable/hooks'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

const periodSlotSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(60),
    type: z.enum(['TEACHING', 'BREAK', 'LUNCH'], { message: 'Type is required' }),
    startTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 09:00'),
    endTime: z.string().regex(TIME_PATTERN, 'Use 24h HH:mm, e.g. 09:50'),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
    }
  })

type PeriodSlotFormValues = z.infer<typeof periodSlotSchema>

const TYPE_LABEL: Record<PeriodType, string> = {
  TEACHING: 'Teaching',
  BREAK: 'Break',
  LUNCH: 'Lunch',
}

const TYPE_COLOR: Record<PeriodType, string> = {
  TEACHING: 'blue',
  BREAK: 'orange',
  LUNCH: 'green',
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as PeriodType[]).map((value) => ({ value, label: TYPE_LABEL[value] }))

const emptyValues: PeriodSlotFormValues = { label: '', type: 'TEACHING', startTime: '', endTime: '' }

interface PeriodSlotFormModalProps {
  open: boolean
  onClose: () => void
  /** Present when editing an existing row — type stays editable regardless of how it was originally created. */
  period?: PeriodSlot
  /** Present when adding via a quick "Add period/break/lunch" button — seeds the type and a sensible default label. */
  addType?: PeriodType
  addLabel?: string
}

function PeriodSlotFormModal({ open, onClose, period, addType, addLabel }: PeriodSlotFormModalProps) {
  const isEditing = !!period
  // Type is only locked for the "Add break"/"Add lunch" quick actions — editing an
  // existing row, or adding via "Add period", both leave the type picker open.
  const lockType = !isEditing && !!addType && addType !== 'TEACHING'
  const createPeriod = useCreatePeriodSlot()
  const updatePeriod = useUpdatePeriodSlot()
  const submitting = createPeriod.isPending || updatePeriod.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodSlotFormValues>({
    resolver: zodResolver(periodSlotSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    if (period) {
      reset({ label: period.label, type: period.type, startTime: period.startTime, endTime: period.endTime })
    } else {
      reset({ label: addLabel ?? '', type: addType ?? 'TEACHING', startTime: '', endTime: '' })
    }
  }, [open, period, addType, addLabel, reset])

  async function onSubmit(values: PeriodSlotFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled
    // (a 409 PERIOD_OVERLAP from the backend surfaces the same way, with
    // its exact conflicting-period message shown verbatim).
    if (period) {
      await updatePeriod.mutateAsync({ id: period.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createPeriod.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Modal
      title={isEditing ? 'Edit period' : 'Add period'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={submitting}
      okText={isEditing ? 'Save changes' : 'Add'}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Label" validateStatus={errors.label ? 'error' : ''} help={errors.label?.message}>
          <Controller
            name="label"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Period 1" />}
          />
        </Form.Item>

        <Form.Item label="Type" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => <Select {...field} disabled={lockType} options={TYPE_OPTIONS} />}
          />
        </Form.Item>

        <Form.Item label="Start time" validateStatus={errors.startTime ? 'error' : ''} help={errors.startTime?.message}>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                value={field.value ? dayjs(field.value, 'HH:mm') : null}
                onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="End time" validateStatus={errors.endTime ? 'error' : ''} help={errors.endTime?.message}>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TimePicker
                style={{ width: '100%' }}
                format="HH:mm"
                value={field.value ? dayjs(field.value, 'HH:mm') : null}
                onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

interface ModalState {
  period?: PeriodSlot
  addType?: PeriodType
  addLabel?: string
}

export function PeriodSlotsPage() {
  const [modalState, setModalState] = useState<ModalState | null>(null)

  const query = usePeriodSlotsQuery()
  const deletePeriod = useDeletePeriodSlot()

  const periods = useMemo(() => query.data ?? [], [query.data])

  const nextPeriodNumber = useMemo(() => periods.filter((p) => p.type === 'TEACHING').length + 1, [periods])

  const openAdd = useCallback(
    (type: PeriodType) => {
      const addLabel = type === 'TEACHING' ? `Period ${nextPeriodNumber}` : type === 'BREAK' ? 'Break' : 'Lunch'
      setModalState({ addType: type, addLabel })
    },
    [nextPeriodNumber],
  )

  const openEdit = useCallback((period: PeriodSlot) => setModalState({ period }), [])

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (period: PeriodSlot) => deletePeriod.mutateAsync(period.id).catch(() => undefined),
    [deletePeriod],
  )

  return (
    <div>
      <Typography.Paragraph style={{ marginBottom: 8 }}>
        <Link to="/timetable">&larr; Back to timetable</Link>
      </Typography.Paragraph>

      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Configure the day
          </Typography.Title>
          <Typography.Text type="secondary">
            The shared daily bell schedule — periods, breaks, and lunch — used across every section's timetable.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={() => openAdd('TEACHING')}>
            Add period
          </Button>
          <Button onClick={() => openAdd('BREAK')}>Add break</Button>
          <Button onClick={() => openAdd('LUNCH')}>Add lunch</Button>
        </Space>
      </Flex>

      <Card>
        {query.isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : periods.length === 0 ? (
          <Empty description="No periods configured yet — add your first period to start building this college's daily schedule.">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd('TEACHING')}>
              Add period
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={periods}
            renderItem={(period) => (
              <List.Item
                key={period.id}
                actions={[
                  <Button key="edit" size="small" onClick={() => openEdit(period)}>
                    Edit
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete period"
                    description={`Delete "${period.label}"? This cannot be undone.`}
                    onConfirm={() => handleDelete(period)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger>
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Flex align="center" gap={16}>
                  <Typography.Text strong style={{ width: 120 }}>
                    {period.startTime}–{period.endTime}
                  </Typography.Text>
                  <Typography.Text>{period.label}</Typography.Text>
                  <Tag color={TYPE_COLOR[period.type]}>{TYPE_LABEL[period.type]}</Tag>
                </Flex>
              </List.Item>
            )}
          />
        )}
      </Card>

      <PeriodSlotFormModal
        open={modalState !== null}
        onClose={() => setModalState(null)}
        period={modalState?.period}
        addType={modalState?.addType}
        addLabel={modalState?.addLabel}
      />
    </div>
  )
}
