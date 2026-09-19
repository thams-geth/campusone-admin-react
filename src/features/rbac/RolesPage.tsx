import { useMemo } from 'react'
import { Button, Card, Flex, Form, Select, Space, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { TableProps } from 'antd'
import type { Role } from '@/services/api/rbacApi'
import { useAllFacultyForRoles, useAssignRole, usePermissionsQuery, useRolesQuery } from '@/features/rbac/hooks'

function RolesTab() {
  const rolesQuery = useRolesQuery()
  const permissionsQuery = usePermissionsQuery()

  const descriptionByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of permissionsQuery.data ?? []) {
      map.set(p.key, p.description)
    }
    return map
  }, [permissionsQuery.data])

  const columns: TableProps<Role>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Type',
      dataIndex: 'isSystem',
      width: 140,
      render: (value: boolean) => <Tag color={value ? 'blue' : 'default'}>{value ? 'System' : 'Custom'}</Tag>,
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      render: (value: string[]) => `${value.length} granted`,
    },
  ]

  return (
    <Card>
      <Table<Role>
        rowKey="id"
        columns={columns}
        dataSource={rolesQuery.data}
        loading={rolesQuery.isFetching}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <Flex gap={8} wrap>
              {record.permissions.length === 0 ? (
                <Typography.Text type="secondary">No permissions granted.</Typography.Text>
              ) : (
                record.permissions.map((key) => (
                  <Tooltip key={key} title={descriptionByKey.get(key) ?? 'No description available'}>
                    <Tag>{key}</Tag>
                  </Tooltip>
                ))
              )}
            </Flex>
          ),
        }}
      />
    </Card>
  )
}

interface AssignRoleFormValues {
  facultyId: string
  roleName: string
}

function AssignRoleTab() {
  const [form] = Form.useForm<AssignRoleFormValues>()
  const rolesQuery = useRolesQuery()
  const facultyQuery = useAllFacultyForRoles()
  const assignRole = useAssignRole()

  const facultyOptions = useMemo(
    () =>
      (facultyQuery.data?.data ?? []).map((f) => ({
        value: f.id,
        label: `${f.name} (${f.email})`,
      })),
    [facultyQuery.data],
  )

  const roleOptions = useMemo(
    () => (rolesQuery.data ?? []).map((r) => ({ value: r.name, label: r.name })),
    [rolesQuery.data],
  )

  const facultyById = useMemo(() => {
    const map = new Map<string, { userId: string }>()
    for (const f of facultyQuery.data?.data ?? []) {
      map.set(f.id, { userId: f.userId })
    }
    return map
  }, [facultyQuery.data])

  const handleFinish = (values: AssignRoleFormValues) => {
    const faculty = facultyById.get(values.facultyId)
    if (!faculty) return
    assignRole.mutate(
      { userId: faculty.userId, input: { roleName: values.roleName } },
      {
        onSuccess: () => form.resetFields(),
      },
    )
  }

  return (
    <Card style={{ maxWidth: 480 }}>
      <Form<AssignRoleFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="facultyId"
          label="Faculty member"
          rules={[{ required: true, message: 'Select a faculty member' }]}
        >
          <Select
            showSearch
            placeholder="Search by name or email"
            options={facultyOptions}
            loading={facultyQuery.isFetching}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item name="roleName" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
          <Select placeholder="Select a role" options={roleOptions} loading={rolesQuery.isFetching} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={assignRole.isPending}>
              Assign
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Only Faculty can be assigned a role here — Students mostly have no login yet, so there&apos;s no
        user-with-known-userId list to pick them from.
      </Typography.Text>
    </Card>
  )
}

export function RolesPage() {
  const items = [
    { key: 'roles', label: 'Roles', children: <RolesTab /> },
    { key: 'assign', label: 'Assign role', children: <AssignRoleTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Roles & Permissions
      </Typography.Title>
      <Tabs defaultActiveKey="roles" items={items} />
    </div>
  )
}
