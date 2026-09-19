import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Assignment } from '@/services/api/assignmentsApi'
import { assignmentSchema, type AssignmentFormValues } from '@/features/assignments/assignmentSchema'
import {
  useAllSectionsForAssignments,
  useAllSubjectsForAssignments,
  useCreateAssignment,
  useUpdateAssignment,
} from '@/features/assignments/hooks'

interface AssignmentFormDrawerProps {
  open: boolean
  onClose: () => void
  assignment?: Assignment
}

const emptyValues: AssignmentFormValues = {
  title: '',
  description: '',
  subjectId: '',
  sectionId: '',
  startDate: '',
  dueDate: '',
  maxMarks: 100,
}

export function AssignmentFormDrawer({ open, onClose, assignment }: AssignmentFormDrawerProps) {
  const isEditing = !!assignment
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const submitting = createAssignment.isPending || updateAssignment.isPending

  const subjectsQuery = useAllSubjectsForAssignments()
  const sectionsQuery = useAllSectionsForAssignments()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        assignment
          ? {
              title: assignment.title,
              description: assignment.description ?? '',
              subjectId: assignment.subjectId,
              sectionId: assignment.sectionId,
              startDate: assignment.startDate,
              dueDate: assignment.dueDate,
              maxMarks: assignment.maxMarks,
            }
          : emptyValues,
      )
    }
  }, [open, assignment, reset])

  async function onSubmit(values: AssignmentFormValues) {
    const input = {
      ...values,
      description: values.description || undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (assignment) {
      await updateAssignment.mutateAsync({ id: assignment.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createAssignment.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit assignment' : 'Add assignment'}
      open={open}
      onClose={onClose}
      size={480}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create assignment'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Title" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Controller name="title" control={control} render={({ field }) => <Input {...field} placeholder="Unit 3 problem set" />} />
        </Form.Item>

        <Form.Item label="Description" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
          <Controller name="description" control={control} render={({ field }) => <Input.TextArea {...field} rows={4} />} />
        </Form.Item>

        <Form.Item label="Subject" validateStatus={errors.subjectId ? 'error' : ''} help={errors.subjectId?.message}>
          <Controller
            name="subjectId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={subjectsQuery.isPending}
                options={(subjectsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                placeholder="Select subject"
              />
            )}
          />
        </Form.Item>

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

        <Form.Item label="Start date" validateStatus={errors.startDate ? 'error' : ''} help={errors.startDate?.message}>
          <Controller
            name="startDate"
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

        <Form.Item label="Due date" validateStatus={errors.dueDate ? 'error' : ''} help={errors.dueDate?.message}>
          <Controller
            name="dueDate"
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

        <Form.Item label="Max marks" validateStatus={errors.maxMarks ? 'error' : ''} help={errors.maxMarks?.message}>
          <Controller
            name="maxMarks"
            control={control}
            render={({ field }) => <InputNumber {...field} min={1} style={{ width: '100%' }} />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
