import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Select, Space, TimePicker } from 'antd'
import type { ExamSchedule } from '@/services/api/examinationsApi'
import { examScheduleSchema, type ExamScheduleFormValues } from '@/features/examinations/examSchema'
import { useAllRooms, useAllSubjects, useCreateExamSchedule, useUpdateExamSchedule } from '@/features/examinations/hooks'

interface ExamScheduleFormDrawerProps {
  open: boolean
  onClose: () => void
  examId: string
  schedule?: ExamSchedule
}

const emptyValues: ExamScheduleFormValues = {
  subjectId: '',
  examDate: '',
  startTime: '',
  endTime: '',
  roomId: '',
}

export function ExamScheduleFormDrawer({ open, onClose, examId, schedule }: ExamScheduleFormDrawerProps) {
  const isEditing = !!schedule
  const createSchedule = useCreateExamSchedule()
  const updateSchedule = useUpdateExamSchedule()
  const submitting = createSchedule.isPending || updateSchedule.isPending

  const subjectsQuery = useAllSubjects()
  const roomsQuery = useAllRooms()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamScheduleFormValues>({
    resolver: zodResolver(examScheduleSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        schedule
          ? {
              subjectId: schedule.subjectId,
              examDate: schedule.examDate,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              roomId: schedule.roomId,
            }
          : emptyValues,
      )
    }
  }, [open, schedule, reset])

  async function onSubmit(values: ExamScheduleFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (schedule) {
      await updateSchedule
        .mutateAsync({ id: schedule.id, input: values, examId }, { onSuccess: onClose })
        .catch(() => undefined)
    } else {
      await createSchedule.mutateAsync({ examId, input: values }, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit schedule' : 'Add schedule'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add schedule'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Subject" validateStatus={errors.subjectId ? 'error' : ''} help={errors.subjectId?.message}>
          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={subjectsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select subject"
                options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name} (sem ${s.semesterNumber})` }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Exam date" validateStatus={errors.examDate ? 'error' : ''} help={errors.examDate?.message}>
          <Controller
            name="examDate"
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

        <Form.Item label="Room" validateStatus={errors.roomId ? 'error' : ''} help={errors.roomId?.message}>
          <Controller
            name="roomId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={roomsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select room"
                options={(roomsQuery.data?.data ?? []).map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
