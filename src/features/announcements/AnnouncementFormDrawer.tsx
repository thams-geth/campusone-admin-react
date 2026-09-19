import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import type { Announcement, AnnouncementAudience } from '@/services/api/announcementsApi'
import { announcementSchema, type AnnouncementFormValues } from '@/features/announcements/announcementSchema'
import {
  useAllBatches,
  useAllDepartmentsForAnnouncements,
  useAllPrograms,
  useAllSections,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '@/features/announcements/hooks'

interface AnnouncementFormDrawerProps {
  open: boolean
  onClose: () => void
  announcement?: Announcement
}

const emptyValues: AnnouncementFormValues = {
  title: '',
  content: '',
  audience: 'COLLEGE',
  departmentId: undefined,
  programId: undefined,
  batchId: undefined,
  sectionId: undefined,
  priority: 'MEDIUM',
  publishAt: undefined,
  expiryAt: undefined,
}

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: 'COLLEGE', label: 'Whole college' },
  { value: 'DEPARTMENT', label: 'A department' },
  { value: 'PROGRAM', label: 'A program' },
  { value: 'BATCH', label: 'A batch' },
  { value: 'SECTION', label: 'A section' },
]

export function AnnouncementFormDrawer({ open, onClose, announcement }: AnnouncementFormDrawerProps) {
  const isEditing = !!announcement
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()
  const submitting = createAnnouncement.isPending || updateAnnouncement.isPending

  const departmentsQuery = useAllDepartmentsForAnnouncements()
  const programsQuery = useAllPrograms()
  const batchesQuery = useAllBatches()
  const sectionsQuery = useAllSections()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: emptyValues,
  })

  const audience = useWatch({ control, name: 'audience' })

  useEffect(() => {
    if (open) {
      reset(
        announcement
          ? {
              title: announcement.title,
              content: announcement.content,
              audience: announcement.audience,
              departmentId: announcement.departmentId ?? undefined,
              programId: announcement.programId ?? undefined,
              batchId: announcement.batchId ?? undefined,
              sectionId: announcement.sectionId ?? undefined,
              priority: announcement.priority,
              publishAt: announcement.publishAt,
              expiryAt: announcement.expiryAt ?? undefined,
            }
          : emptyValues,
      )
    }
  }, [open, announcement, reset])

  async function onSubmit(values: AnnouncementFormValues) {
    const input = {
      ...values,
      departmentId: values.audience === 'DEPARTMENT' ? values.departmentId : undefined,
      programId: values.audience === 'PROGRAM' ? values.programId : undefined,
      batchId: values.audience === 'BATCH' ? values.batchId : undefined,
      sectionId: values.audience === 'SECTION' ? values.sectionId : undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (announcement) {
      await updateAnnouncement
        .mutateAsync({ id: announcement.id, input }, { onSuccess: onClose })
        .catch(() => undefined)
    } else {
      await createAnnouncement.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit announcement' : 'Add announcement'}
      open={open}
      onClose={onClose}
      size={480}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Publish announcement'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Title" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Controller name="title" control={control} render={({ field }) => <Input {...field} placeholder="Mid-term exam schedule released" />} />
        </Form.Item>

        <Form.Item label="Content" validateStatus={errors.content ? 'error' : ''} help={errors.content?.message}>
          <Controller name="content" control={control} render={({ field }) => <Input.TextArea {...field} rows={4} />} />
        </Form.Item>

        <Form.Item label="Audience" validateStatus={errors.audience ? 'error' : ''} help={errors.audience?.message}>
          <Controller
            name="audience"
            control={control}
            render={({ field }) => <Select {...field} options={AUDIENCE_OPTIONS} />}
          />
        </Form.Item>

        {audience === 'DEPARTMENT' && (
          <Form.Item label="Department" validateStatus={errors.departmentId ? 'error' : ''} help={errors.departmentId?.message}>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  loading={departmentsQuery.isPending}
                  options={(departmentsQuery.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
                  placeholder="Select department"
                />
              )}
            />
          </Form.Item>
        )}

        {audience === 'PROGRAM' && (
          <Form.Item label="Program" validateStatus={errors.programId ? 'error' : ''} help={errors.programId?.message}>
            <Controller
              name="programId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  loading={programsQuery.isPending}
                  options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
                  placeholder="Select program"
                />
              )}
            />
          </Form.Item>
        )}

        {audience === 'BATCH' && (
          <Form.Item label="Batch" validateStatus={errors.batchId ? 'error' : ''} help={errors.batchId?.message}>
            <Controller
              name="batchId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  loading={batchesQuery.isPending}
                  options={(batchesQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
                  placeholder="Select batch"
                />
              )}
            />
          </Form.Item>
        )}

        {audience === 'SECTION' && (
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
        )}

        <Form.Item label="Priority">
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Publish at" help="Leave blank to publish immediately">
          <Controller
            name="publishAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                showTime
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Expires at" help="Leave blank for no expiry">
          <Controller
            name="expiryAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                showTime
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
