import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, DatePicker, Drawer, Form, Select, Space } from 'antd'
import type { PersonType } from '@/services/api/libraryApi'
import { issueBookSchema, type IssueBookFormValues } from '@/features/library/issueSchema'
import {
  useAllBooksForLookup,
  useAllFacultyForLibrary,
  useAllStudentsForLibrary,
  useIssueBook,
} from '@/features/library/hooks'

interface IssueBookFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: IssueBookFormValues = {
  bookId: '',
  ownerType: 'STUDENT',
  ownerId: '',
  dueDate: '',
}

const OWNER_TYPE_OPTIONS: { value: PersonType; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
]

export function IssueBookFormDrawer({ open, onClose }: IssueBookFormDrawerProps) {
  const issueBook = useIssueBook()
  const booksQuery = useAllBooksForLookup()
  const studentsQuery = useAllStudentsForLibrary()
  const facultyQuery = useAllFacultyForLibrary()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueBookFormValues>({
    resolver: zodResolver(issueBookSchema),
    defaultValues: emptyValues,
  })

  const ownerType = useWatch({ control, name: 'ownerType' })

  useEffect(() => {
    if (open) reset(emptyValues)
  }, [open, reset])

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: IssueBookFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await issueBook.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  const ownerOptions =
    ownerType === 'FACULTY'
      ? (facultyQuery.data?.data ?? []).map((f) => ({ value: f.id, label: `${f.name} (${f.employeeCode})` }))
      : (studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` }))

  return (
    <Drawer
      title="Issue book"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={issueBook.isPending} onClick={handleSubmit(onSubmit)}>
            Issue book
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Book" validateStatus={errors.bookId ? 'error' : ''} help={errors.bookId?.message}>
          <Controller
            name="bookId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={booksQuery.isPending}
                placeholder="Select book"
                optionFilterProp="label"
                options={(booksQuery.data?.data ?? []).map((b) => ({ value: b.id, label: `${b.title} — ${b.author}` }))}
              />
            )}
          />
        </Form.Item>

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
                loading={ownerType === 'FACULTY' ? facultyQuery.isPending : studentsQuery.isPending}
                placeholder={ownerType === 'FACULTY' ? 'Select faculty' : 'Select student'}
                optionFilterProp="label"
                options={ownerOptions}
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
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
