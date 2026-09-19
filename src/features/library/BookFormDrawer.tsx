import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Input, InputNumber, Space } from 'antd'
import type { Book } from '@/services/api/libraryApi'
import { bookSchema, type BookFormValues } from '@/features/library/bookSchema'
import { useCreateBook, useUpdateBook } from '@/features/library/hooks'

interface BookFormDrawerProps {
  open: boolean
  onClose: () => void
  book?: Book
}

const emptyValues: BookFormValues = {
  title: '',
  author: '',
  publisher: '',
  category: '',
  isbn: '',
  totalCopies: 1,
}

export function BookFormDrawer({ open, onClose, book }: BookFormDrawerProps) {
  const isEditing = !!book
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const submitting = createBook.isPending || updateBook.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset(
        book
          ? {
              title: book.title,
              author: book.author,
              publisher: book.publisher ?? '',
              category: book.category ?? '',
              isbn: book.isbn ?? '',
              totalCopies: book.totalCopies,
            }
          : emptyValues,
      )
    }
  }, [open, book, reset])

  async function onSubmit(values: BookFormValues) {
    const input = {
      ...values,
      publisher: values.publisher || undefined,
      category: values.category || undefined,
      isbn: values.isbn || undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (book) {
      await updateBook.mutateAsync({ id: book.id, input }, { onSuccess: onClose }).catch(() => undefined)
    } else {
      await createBook.mutateAsync(input, { onSuccess: onClose }).catch(() => undefined)
    }
  }

  return (
    <Drawer
      title={isEditing ? 'Edit book' : 'Add book'}
      open={open}
      onClose={onClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>
            {isEditing ? 'Save changes' : 'Add book'}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Title" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Controller name="title" control={control} render={({ field }) => <Input {...field} placeholder="Introduction to Algorithms" />} />
        </Form.Item>

        <Form.Item label="Author" validateStatus={errors.author ? 'error' : ''} help={errors.author?.message}>
          <Controller name="author" control={control} render={({ field }) => <Input {...field} placeholder="Thomas H. Cormen" />} />
        </Form.Item>

        <Form.Item label="Publisher" validateStatus={errors.publisher ? 'error' : ''} help={errors.publisher?.message}>
          <Controller name="publisher" control={control} render={({ field }) => <Input {...field} placeholder="Optional" />} />
        </Form.Item>

        <Form.Item label="Category" validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
          <Controller name="category" control={control} render={({ field }) => <Input {...field} placeholder="Computer Science" />} />
        </Form.Item>

        <Form.Item label="ISBN" validateStatus={errors.isbn ? 'error' : ''} help={errors.isbn?.message}>
          <Controller name="isbn" control={control} render={({ field }) => <Input {...field} placeholder="Optional" />} />
        </Form.Item>

        <Form.Item label="Total copies" validateStatus={errors.totalCopies ? 'error' : ''} help={errors.totalCopies?.message}>
          <Controller
            name="totalCopies"
            control={control}
            render={({ field }) => <InputNumber {...field} min={1} style={{ width: '100%' }} />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
