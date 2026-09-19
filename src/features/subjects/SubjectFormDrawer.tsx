import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from 'antd'
import type { Subject } from '@/services/api/subjectsApi'
import { subjectSchema, SUBJECT_TYPE_OPTIONS, type SubjectFormValues } from '@/features/subjects/subjectSchema'
import {
  useAllFacultyForSubjects,
  useAllProgramsForSubjects,
  useCreateSubject,
  useUpdateSubject,
} from '@/features/subjects/hooks'

interface SubjectFormDrawerProps {
  open: boolean
  onClose: () => void
  subject?: Subject
}

const emptyValues: SubjectFormValues = {
  programId: '',
  semesterNumber: 1,
  code: '',
  name: '',
  credits: 3,
  type: 'CORE',
  facultyId: undefined,
}

export function SubjectFormDrawer({ open, onClose, subject }: SubjectFormDrawerProps) {
  const isEditing = !!subject
  const programsQuery = useAllProgramsForSubjects()
  const facultyQuery = useAllFacultyForSubjects()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const submitting = createSubject.isPending || updateSubject.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: emptyValues,
  })

  const selectedProgramId = useWatch({ control, name: 'programId' })

  // Filter faculty options to the selected program's department when we
  // can resolve one — falls back to the full faculty list otherwise (no
  // program selected yet, or the program's department isn't loaded).
  const facultyOptions = useMemo(() => {
    const faculty = facultyQuery.data?.data ?? []
    const program = programsQuery.data?.data.find((p) => p.id === selectedProgramId)
    const scoped = program ? faculty.filter((f) => f.departmentId === program.departmentId) : faculty
    return scoped.map((f) => ({ value: f.id, label: f.name }))
  }, [facultyQuery.data, programsQuery.data, selectedProgramId])

  useEffect(() => {
    if (open) {
      reset(
        subject
          ? {
              programId: subject.programId,
              semesterNumber: subject.semesterNumber,
              code: subject.code,
              name: subject.name,
              credits: subject.credits,
              type: subject.type,
              facultyId: subject.facultyId ?? undefined,
            }
          : emptyValues,
      )
    }
  }, [open, subject, reset])

  async function onSubmit(values: SubjectFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (subject) {
      await updateSubject.mutateAsync({ id: subject.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createSubject.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit subject' : 'Add subject'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Create subject'}
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
                optionFilterProp="label"
                placeholder="Select program"
                options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
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
            render={({ field }) => <InputNumber {...field} min={1} max={12} style={{ width: '100%' }} />}
          />
        </Form.Item>

        <Form.Item label="Code" validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input {...field} placeholder="CS301" style={{ textTransform: 'uppercase' }} />}
          />
        </Form.Item>

        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Data Structures & Algorithms" />}
          />
        </Form.Item>

        <Form.Item label="Credits" validateStatus={errors.credits ? 'error' : ''} help={errors.credits?.message}>
          <Controller
            name="credits"
            control={control}
            render={({ field }) => <InputNumber {...field} min={0} max={30} style={{ width: '100%' }} />}
          />
        </Form.Item>

        <Form.Item label="Type" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => <Select {...field} options={[...SUBJECT_TYPE_OPTIONS]} />}
          />
        </Form.Item>

        <Form.Item label="Coordinating faculty" help="Optional — can be assigned later">
          <Controller
            name="facultyId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                allowClear
                showSearch
                loading={facultyQuery.isPending}
                optionFilterProp="label"
                placeholder="Select faculty"
                options={facultyOptions}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
