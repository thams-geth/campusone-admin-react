import { useMemo, useState } from 'react'
import { Button, Card, Flex, Popconfirm, Select, Table, Tabs, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { AllocationStatus, Route, Stop, TransportAllocation, Vehicle } from '@/services/api/transportApi'
import {
  useAllStudentsForTransport,
  useDeleteRoute,
  useDeleteStop,
  useDeleteVehicle,
  useRemoveTransportAllocation,
  useRoutesQuery,
  useTransportAllocationsQuery,
  useVehiclesQuery,
} from '@/features/transport/hooks'
import { VehicleFormDrawer } from '@/features/transport/VehicleFormDrawer'
import { RouteFormDrawer } from '@/features/transport/RouteFormDrawer'
import { StopFormDrawer } from '@/features/transport/StopFormDrawer'
import { TransportAllocationFormDrawer } from '@/features/transport/TransportAllocationFormDrawer'

const STATUS_COLOR: Record<AllocationStatus, string> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
}

function StopsTable({ route, onAddStop }: { route: Route; onAddStop: () => void }) {
  const deleteStop = useDeleteStop()

  const columns: TableProps<Stop>['columns'] = [
    { title: 'Sequence', dataIndex: 'sequence', width: 100, align: 'right' },
    { title: 'Stop name', dataIndex: 'name' },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete stop"
          description={`Delete stop "${record.name}"?`}
          onConfirm={() => deleteStop.mutateAsync(record.id).catch(() => undefined)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Table<Stop>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={route.stops}
        pagination={false}
      />
      <Button style={{ marginTop: 8 }} size="small" onClick={onAddStop}>
        Add stop
      </Button>
    </div>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see the leave module's Tabs+Popconfirm gotcha note. */
export function RoutesVehiclesTab() {
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false)
  const [routeDrawerOpen, setRouteDrawerOpen] = useState(false)
  const [stopDrawerRouteId, setStopDrawerRouteId] = useState<string | undefined>(undefined)

  const vehiclesQuery = useVehiclesQuery()
  const routesQuery = useRoutesQuery()
  const deleteVehicle = useDeleteVehicle()
  const deleteRoute = useDeleteRoute()

  const vehicles = vehiclesQuery.data ?? []
  const routes = routesQuery.data ?? []

  const stopDrawerRoute = routes.find((r) => r.id === stopDrawerRouteId)
  const nextSequence = stopDrawerRoute
    ? Math.max(0, ...stopDrawerRoute.stops.map((s) => s.sequence)) + 1
    : 1

  const vehicleColumns: TableProps<Vehicle>['columns'] = [
    { title: 'Registration', dataIndex: 'registrationNumber' },
    { title: 'Driver', dataIndex: 'driverName' },
    { title: 'Phone', dataIndex: 'driverPhone' },
    { title: 'Capacity', dataIndex: 'capacity', width: 100, align: 'right' },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete vehicle"
          description={`Delete "${record.registrationNumber}"? This cannot be undone.`}
          onConfirm={() => deleteVehicle.mutateAsync(record.id).catch(() => undefined)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const routeColumns: TableProps<Route>['columns'] = [
    { title: 'Route name', dataIndex: 'name' },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleId',
      render: (value: string | null) => vehicles.find((v) => v.id === value)?.registrationNumber ?? '—',
    },
    { title: 'Stops', key: 'stopCount', width: 90, align: 'right', render: (_, record) => record.stops.length },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Delete route"
          description={`Delete "${record.name}"? This cannot be undone.`}
          onConfirm={() => deleteRoute.mutateAsync(record.id).catch(() => undefined)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Vehicles
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setVehicleDrawerOpen(true)}>
          Add vehicle
        </Button>
      </Flex>
      <Card style={{ marginBottom: 24 }}>
        <Table<Vehicle> rowKey="id" columns={vehicleColumns} dataSource={vehicles} loading={vehiclesQuery.isPending} pagination={false} />
      </Card>

      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Routes
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setRouteDrawerOpen(true)}>
          Add route
        </Button>
      </Flex>
      <Card>
        <Table<Route>
          rowKey="id"
          columns={routeColumns}
          dataSource={routes}
          loading={routesQuery.isPending}
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <StopsTable route={record} onAddStop={() => setStopDrawerRouteId(record.id)} />
            ),
          }}
        />
      </Card>

      <VehicleFormDrawer open={vehicleDrawerOpen} onClose={() => setVehicleDrawerOpen(false)} />
      <RouteFormDrawer open={routeDrawerOpen} onClose={() => setRouteDrawerOpen(false)} vehicles={vehicles} />
      <StopFormDrawer
        open={!!stopDrawerRouteId}
        onClose={() => setStopDrawerRouteId(undefined)}
        routeId={stopDrawerRouteId}
        routeName={stopDrawerRoute?.name}
        nextSequence={nextSequence}
      />
    </div>
  )
}

/** Exported so tests can render just this tab's content directly, without antd's Tabs wrapper — see the leave module's Tabs+Popconfirm gotcha note. */
export function TransportAllocationsTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [routeId, setRouteId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<AllocationStatus | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useTransportAllocationsQuery({ page, pageSize, studentId, routeId, status })
  const studentsQuery = useAllStudentsForTransport()
  const routesQuery = useRoutesQuery()
  const removeTransportAllocation = useRemoveTransportAllocation()

  const routes = routesQuery.data ?? []

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, `${s.firstName} ${s.lastName} (${s.rollNumber})`)
    }
    return map
  }, [studentsQuery.data])

  const routeNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of routesQuery.data ?? []) map.set(r.id, r.name)
    return map
  }, [routesQuery.data])

  const stopNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of routesQuery.data ?? []) {
      for (const s of r.stops) map.set(s.id, s.name)
    }
    return map
  }, [routesQuery.data])

  const columns: TableProps<TransportAllocation>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'studentId',
      render: (value: string) => studentNameById.get(value) ?? value,
    },
    {
      title: 'Route',
      dataIndex: 'routeId',
      render: (value: string) => routeNameById.get(value) ?? value,
    },
    {
      title: 'Stop',
      dataIndex: 'stopId',
      render: (value: string) => stopNameById.get(value) ?? value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value: AllocationStatus) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status === 'ACTIVE' ? (
          <Popconfirm
            title="Remove allocation"
            description="Mark this allocation as inactive?"
            onConfirm={() => removeTransportAllocation.mutateAsync(record.id).catch(() => undefined)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Remove
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
          Allocate student
        </Button>
      </Flex>

      <Card>
        <Flex gap={12} style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            showSearch
            placeholder="Student"
            style={{ width: 220 }}
            value={studentId}
            onChange={(value) => {
              setStudentId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={(studentsQuery.data?.data ?? []).map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
            }))}
          />
          <Select
            allowClear
            showSearch
            placeholder="Route"
            style={{ width: 200 }}
            value={routeId}
            onChange={(value) => {
              setRouteId(value)
              setPage(1)
            }}
            optionFilterProp="label"
            options={routes.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Select<AllocationStatus | undefined>
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </Flex>

        <Table<TransportAllocation>
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

      <TransportAllocationFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} routes={routes} />
    </div>
  )
}

export function TransportPage() {
  const items = [
    { key: 'routes', label: 'Routes & vehicles', children: <RoutesVehiclesTab /> },
    { key: 'allocations', label: 'Allocations', children: <TransportAllocationsTab /> },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        Transport
      </Typography.Title>
      <Tabs defaultActiveKey="routes" items={items} />
    </div>
  )
}
