import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Select, Space } from 'antd'
import {
  attendanceSessionSchema,
  type AttendanceSessionFormValues,
} from '@/features/attendance/attendanceSessionSchema'
import { useAllSectionsForAttendance, useAllSubjectsForAttendance, useCreateAttendanceSession } from '@/features/attendance/hooks'

interface AttendanceSessionFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: AttendanceSessionFormValues = {
  sectionId: '',
  subjectId: '',
  date: '',
}

export function AttendanceSessionFormDrawer({ open, onClose }: AttendanceSessionFormDrawerProps) {
  const navigate = useNavigate()
  const createSession = useCreateAttendanceSession()

  const sectionsQuery = useAllSectionsForAttendance()
  const subjectsQuery = useAllSubjectsForAttendance()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AttendanceSessionFormValues>({
    resolver: zodResolver(attendanceSessionSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) reset(emptyValues)
  }, [open, reset])

  async function onSubmit(values: AttendanceSessionFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createSession
      .mutateAsync(
        { sectionId: values.sectionId, subjectId: values.subjectId, date: values.date },
        {
          onSuccess: (session) => {
            onClose()
            navigate(`/attendance/sessions/${session.id}`)
          },
        },
      )
      .catch(() => undefined)
  }

  return (
    <Drawer
      title="New attendance session"
      open={open}
      onClose={onClose}
      size={420}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createSession.isPending} onClick={handleSubmit(onSubmit)}>
            Create session
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Section" validateStatus={errors.sectionId ? 'error' : ''} help={errors.sectionId?.message}>
          <Controller
            name="sectionId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={sectionsQuery.isPending}
                options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select section"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Subject" validateStatus={errors.subjectId ? 'error' : ''} help={errors.subjectId?.message}>
          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={subjectsQuery.isPending}
                options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
                placeholder="Select subject"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Date" validateStatus={errors.date ? 'error' : ''} help={errors.date?.message}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : '')}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
