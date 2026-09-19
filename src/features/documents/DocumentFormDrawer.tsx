import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import type { Document, DocumentOwnerType, DocumentType } from '@/services/api/documentsApi'
import { documentSchema, type DocumentFormValues } from '@/features/documents/documentSchema'
import {
  useAllApplicantsForDocuments,
  useAllFacultyForDocuments,
  useAllStudentsForDocuments,
  useCreateDocument,
  useUpdateDocument,
} from '@/features/documents/hooks'

interface DocumentFormDrawerProps {
  open: boolean
  onClose: () => void
  document?: Document
}

const emptyValues: DocumentFormValues = {
  ownerType: 'STUDENT',
  ownerId: '',
  type: 'BONAFIDE',
  fileUrl: '',
  expiryDate: undefined,
}

const OWNER_TYPE_OPTIONS: { value: DocumentOwnerType; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'APPLICANT', label: 'Applicant' },
]

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'BONAFIDE', label: 'Bonafide' },
  { value: 'TRANSFER_CERTIFICATE', label: 'Transfer certificate' },
  { value: 'CONDUCT_CERTIFICATE', label: 'Conduct certificate' },
  { value: 'MARK_SHEET', label: 'Mark sheet' },
  { value: 'ID_PROOF', label: 'ID proof' },
  { value: 'OTHER', label: 'Other' },
]

export function DocumentFormDrawer({ open, onClose, document }: DocumentFormDrawerProps) {
  const isEditing = !!document
  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()
  const submitting = createDocument.isPending || updateDocument.isPending

  const studentsQuery = useAllStudentsForDocuments()
  const facultyQuery = useAllFacultyForDocuments()
  const applicantsQuery = useAllApplicantsForDocuments()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: emptyValues,
  })

  const ownerType = useWatch({ control, name: 'ownerType' })

  useEffect(() => {
    if (open) {
      reset(
        document
          ? {
              ownerType: document.ownerType,
              ownerId: document.ownerId,
              type: document.type,
              fileUrl: document.fileUrl,
              expiryDate: document.expiryDate ?? undefined,
            }
          : emptyValues,
      )
    }
  }, [open, document, reset])

  const ownerOptions =
    ownerType === 'FACULTY'
      ? (facultyQuery.data?.data ?? []).map((f) => ({ value: f.id, label: `${f.name} (${f.employeeCode})` }))
      : ownerType === 'APPLICANT'
        ? (applicantsQuery.data?.data ?? []).map((a) => ({
            value: a.id,
            label: `${a.firstName} ${a.lastName} (${a.email})`,
          }))
        : (studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` }))

  const ownerLoading =
    ownerType === 'FACULTY' ? facultyQuery.isPending : ownerType === 'APPLICANT' ? applicantsQuery.isPending : studentsQuery.isPending

  async function onSubmit(values: DocumentFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (document) {
      await updateDocument.mutateAsync({ id: document.id, input: values }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createDocument.mutateAsync(values, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit document' : 'Add document'}
      open={open}
      onClose={onClose}
      size={420}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add document'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Owner type" validateStatus={errors.ownerType ? 'error' : ''} help={errors.ownerType?.message}>
          <Controller
            name="ownerType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={OWNER_TYPE_OPTIONS}
                onChange={(value) => {
                  field.onChange(value)
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Owner" validateStatus={errors.ownerId ? 'error' : ''} help={errors.ownerId?.message}>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={ownerLoading}
                placeholder="Select owner"
                optionFilterProp="label"
                options={ownerOptions}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Document type" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
          <Controller name="type" control={control} render={({ field }) => <Select {...field} options={DOCUMENT_TYPE_OPTIONS} />} />
        </Form.Item>

        <Form.Item
          label="File URL"
          validateStatus={errors.fileUrl ? 'error' : ''}
          help={errors.fileUrl?.message ?? 'There is no file upload/storage backend — this is just a reference URL.'}
        >
          <Controller name="fileUrl" control={control} render={({ field }) => <Input {...field} placeholder="https://..." />} />
        </Form.Item>

        <Form.Item label="Expiry date" help="Leave blank if this document doesn't expire">
          <Controller
            name="expiryDate"
            control={control}
            render={({ field }) => (
              <DatePicker
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
