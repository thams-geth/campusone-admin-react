import { useMemo, useState } from 'react'
import { Button, Card, Flex, Input, Popconfirm, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { Book, BookIssue, PersonType } from '@/services/api/libraryApi'
import {
  useAllBooksForLookup,
  useAllFacultyForLibrary,
  useAllStudentsForLibrary,
  useBooksQuery,
  useDeleteBook,
  useIssuesQuery,
  useReturnBook,
} from '@/features/library/hooks'
import { deriveIssueStatus, type IssueStatus } from '@/features/library/issueStatus'
import { BookFormDrawer } from '@/features/library/BookFormDrawer'
import { IssueBookFormDrawer } from '@/features/library/IssueBookFormDrawer'
import { formatDate } from '@/utils/formatDate'

const STATUS_COLOR: Record<IssueStatus, string> = {
  ISSUED: 'blue',
  OVERDUE: 'error',
  RETURNED: 'success',
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see LibraryPage.test.tsx. */
export function BooksTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined)

  const query = useBooksQuery({ page, pageSize, search, category })
  const deleteBook = useDeleteBook()

  const handleDelete = (book: Book) => deleteBook.mutateAsync(book.id).catch(() => undefined)

  const columns: TableProps<Book>['columns'] = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Author', dataIndex: 'author' },
    { title: 'Category', dataIndex: 'category', render: (value: string | null) => value ?? '—' },
    { title: 'Total copies', dataIndex: 'totalCopies', width: 120, align: 'right' },
    { title: 'Available', dataIndex: 'availableCopies', width: 110, align: 'right' },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingBook(record)
              setDrawerOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete book"
            description={`Delete "${record.title}"? This cannot be undone.`}
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBook(undefined)
            setDrawerOpen(true)
          }}
        >
          Add book
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            placeholder="Search by title or author"
            prefix={<SearchOutlined />}
            style={{ maxWidth: 320 }}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Input
            allowClear
            placeholder="Category"
            style={{ maxWidth: 200 }}
            onChange={(e) => {
              setCategory(e.target.value || undefined)
              setPage(1)
            }}
          />
        </Flex>

        <Table<Book>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <BookFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} book={editingBook} />
    </div>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see LibraryPage.test.tsx. */
export function IssuesTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [bookId, setBookId] = useState<string | undefined>(undefined)
  const [ownerType, setOwnerType] = useState<PersonType | undefined>(undefined)
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useIssuesQuery({ page, pageSize, bookId, ownerType, ownerId })
  const booksQuery = useAllBooksForLookup()
  const studentsQuery = useAllStudentsForLibrary()
  const facultyQuery = useAllFacultyForLibrary()
  const returnBook = useReturnBook()

  const bookTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of booksQuery.data?.data ?? []) map.set(b.id, b.title)
    return map
  }, [booksQuery.data])

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) map.set(s.id, `${s.firstName} ${s.lastName}`)
    return map
  }, [studentsQuery.data])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of facultyQuery.data?.data ?? []) map.set(f.id, f.name)
    return map
  }, [facultyQuery.data])

  function ownerName(issue: BookIssue): string {
    const map = issue.ownerType === 'FACULTY' ? facultyNameById : studentNameById
    return map.get(issue.ownerId) ?? issue.ownerId
  }

  const ownerOptions =
    ownerType === 'FACULTY'
      ? (facultyQuery.data?.data ?? []).map((f) => ({ value: f.id, label: f.name }))
      : (studentsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))

  const columns: TableProps<BookIssue>['columns'] = [
    {
      title: 'Book',
      dataIndex: 'bookId',
      render: (value: string) => bookTitleById.get(value) ?? value,
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_, record) => (
        <Space>
          <Tag>{record.ownerType}</Tag>
          {ownerName(record)}
        </Space>
      ),
    },
    { title: 'Issued', dataIndex: 'issuedAt', width: 120, render: formatDate },
    { title: 'Due', dataIndex: 'dueDate', width: 120, render: formatDate },
    {
      title: 'Returned',
      dataIndex: 'returnedAt',
      width: 120,
      render: (value: string | null) => (value ? formatDate(value) : '—'),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => {
        const status = deriveIssueStatus(record)
        return <Tag color={STATUS_COLOR[status]}>{status}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        !record.returnedAt ? (
          <Popconfirm
            title="Return book"
            description="Mark this book as returned?"
            onConfirm={() => returnBook.mutateAsync(record.id).catch(() => undefined)}
            okText="Return"
          >
            <Button size="small" type="primary">
              Return
            </Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Issue book
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Book"
            style={{ width: 220 }}
            value={bookId}
            onChange={(value) => {
              setBookId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={(booksQuery.data?.data ?? []).map((b) => ({ value: b.id, label: b.title }))}
          />
          <Select<PersonType | undefined>
            allowClear
            placeholder="Owner type"
            style={{ width: 140 }}
            value={ownerType}
            onChange={(value) => {
              setOwnerType(value)
              setOwnerId(undefined)
              setPage(1)
            }}
            options={[
              { value: 'STUDENT', label: 'Student' },
              { value: 'FACULTY', label: 'Faculty' },
            ]}
          />
          <Select<string | undefined>
            allowClear
            showSearch
            placeholder="Owner"
            style={{ width: 200 }}
            value={ownerId}
            onChange={(value) => {
              setOwnerId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={ownerOptions}
          />
        </Flex>

        <Table<BookIssue>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.meta.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>

      <IssueBookFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export function LibraryPage() {
  const items = [
    { key: 'books', label: 'Books', children: <BooksTab /> },
    { key: 'issues', label: 'Issues', children: <IssuesTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Library
      </Typography.Title>
      <Tabs defaultActiveKey="books" items={items} />
    </div>
  )
}
