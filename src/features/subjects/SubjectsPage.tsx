import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Flex, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Subject, SubjectType } from '@/services/api/subjectsApi'
import { useAuth } from '@/features/auth/useAuth'
import { ADMIN_ROLES } from '@/app/router/navConfig'
import { SUBJECT_TYPE_COLOR, SUBJECT_TYPE_OPTIONS } from '@/features/subjects/subjectSchema'
import {
  useAllFacultyForSubjects,
  useAllProgramsForSubjects,
  useDeleteSubject,
  useSubjectsQuery,
} from '@/features/subjects/hooks'
import { SubjectFormDrawer } from '@/features/subjects/SubjectFormDrawer'

export function SubjectsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole(...ADMIN_ROLES)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [semesterNumber, setSemesterNumber] = useState<number | undefined>(undefined)
  const [type, setType] = useState<SubjectType | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined)

  const query = useSubjectsQuery({ page, pageSize, programId, semesterNumber, type })
  const programsQuery = useAllProgramsForSubjects()
  const facultyQuery = useAllFacultyForSubjects()
  const deleteSubject = useDeleteSubject()

  const programNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of programsQuery.data?.data ?? []) {
      map.set(p.id, p.name)
    }
    return map
  }, [programsQuery.data])

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of facultyQuery.data?.data ?? []) {
      map.set(f.id, f.name)
    }
    return map
  }, [facultyQuery.data])

  const handleDelete = useCallback(
    // Errors are surfaced via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    (subject: Subject) => deleteSubject.mutateAsync(subject.id).catch(() => undefined),
    [deleteSubject],
  )

  const columns = useMemo<TableProps<Subject>['columns']>(
    () => [
      { title: 'Code', dataIndex: 'code', width: 120 },
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Program',
        dataIndex: 'programId',
        render: (value: string) => programNameById.get(value) ?? value,
      },
      { title: 'Semester', dataIndex: 'semesterNumber', width: 100, align: 'right' },
      { title: 'Credits', dataIndex: 'credits', width: 100, align: 'right' },
      {
        title: 'Type',
        dataIndex: 'type',
        width: 120,
        render: (value: SubjectType) => <Tag color={SUBJECT_TYPE_COLOR[value]}>{value}</Tag>,
      },
      {
        title: 'Coordinating faculty',
        dataIndex: 'facultyId',
        render: (value: string | null) => (value ? (facultyNameById.get(value) ?? value) : '—'),
      },
      ...(canManage
        ? [
            {
              title: 'Actions',
              key: 'actions',
              width: 160,
              render: (_: unknown, record: Subject) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingSubject(record)
                      setDrawerOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete subject"
                    description={`Delete "${record.name}"? This cannot be undone.`}
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
        : []),
    ],
    [canManage, facultyNameById, handleDelete, programNameById],
  )

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Subjects
        </Typography.Title>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSubject(undefined)
              setDrawerOpen(true)
            }}
          >
            Add subject
          </Button>
        )}
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            showSearch
            placeholder="Program"
            style={{ width: 240 }}
            loading={programsQuery.isPending}
            optionFilterProp="label"
            value={programId}
            onChange={(value) => {
              setProgramId(value)
              setPage(1)
            }}
            options={(programsQuery.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <InputNumber
            placeholder="Semester"
            style={{ width: 120 }}
            min={1}
            max={12}
            value={semesterNumber}
            onChange={(value) => {
              setSemesterNumber(value ?? undefined)
              setPage(1)
            }}
          />
          <Select
            allowClear
            placeholder="Type"
            style={{ width: 160 }}
            value={type}
            onChange={(value) => {
              setType(value)
              setPage(1)
            }}
            options={[...SUBJECT_TYPE_OPTIONS]}
          />
        </Flex>

        <Table<Subject>
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

      {canManage && (
        <SubjectFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} subject={editingSubject} />
      )}
    </div>
  )
}
