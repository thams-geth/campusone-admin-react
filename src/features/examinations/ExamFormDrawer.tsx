import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Exam } from '@/services/api/examinationsApi'
import { EXAM_TYPE_OPTIONS, examSchema, type ExamFormValues } from '@/features/examinations/examSchema'
import { useAllAcademicYears, useCreateExam, useUpdateExam } from '@/features/examinations/hooks'

interface ExamFormDrawerProps {
  open: boolean
  onClose: () => void
  exam?: Exam
}

const emptyValues: ExamFormValues = {
  name: '',
  examType: 'INTERNAL',
  academicYearId: '',
  semesterNumber: 1,
  startDate: '',
  endDate: '',
}

export function ExamFormDrawer({ open, onClose, exam }: ExamFormDrawerProps) {
  const isEditing = !!exam
  const createExam = useCreateExam()
  const updateExam = useUpdateExam()
  const submitting = createExam.isPending || updateExam.isPending

  const academicYearsQuery = useAllAcademicYears()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        exam
          ? {
              name: exam.name,
              examType: exam.examType,
              academicYearId: exam.academicYearId,
              semesterNumber: exam.semesterNumber,
              startDate: exam.startDate,
              endDate: exam.endDate,
            }
          : emptyValues,
      )
    }
  }, [open, exam, reset])

  async function onSubmit(values: ExamFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (exam) {
      await updateExam.mutateAsync({ id: exam.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createExam.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit exam' : 'Add exam'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create exam'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Mid-term 2026" />} />
        </Form.Item>

        <Form.Item label="Exam type" validateStatus={errors.examType ? 'error' : ''} help={errors.examType?.message}>
          <Controller
            name="examType"
            control={control}
            render={({ field }) => <Select {...field} options={[...EXAM_TYPE_OPTIONS]} />}
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
                showSearch
                loading={academicYearsQuery.isPending}
                optionFilterProp="label"
                placeholder="Select academic year"
                options={(academicYearsQuery.data?.data ?? []).map((y) => ({ value: y.id, label: y.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Semester"
          validateStatus={errors.semesterNumber ? 'error' : ''}
          help={errors.semesterNumber?.message}
        >
          <Controller
            name="semesterNumber"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} max={12} style={{ width: '100%' }} />
            )}
          />
        </Form.Item>

        <Form.Item label="Start date" validateStatus={errors.startDate ? 'error' : ''} help={errors.startDate?.message}>
          <Controller
            name="startDate"
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

        <Form.Item label="End date" validateStatus={errors.endDate ? 'error' : ''} help={errors.endDate?.message}>
          <Controller
            name="endDate"
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
