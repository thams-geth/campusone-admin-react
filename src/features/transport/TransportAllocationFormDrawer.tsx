import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Select, Space } from 'antd'
import type { Route } from '@/services/api/transportApi'
import { transportAllocationSchema, type TransportAllocationFormValues } from '@/features/transport/transportSchema'
import { useAllStudentsForTransport, useCreateTransportAllocation } from '@/features/transport/hooks'

interface TransportAllocationFormDrawerProps {
  open: boolean
  onClose: () => void
  routes: Route[]
}

const emptyValues: TransportAllocationFormValues = { studentId: '', routeId: '', stopId: '' }

export function TransportAllocationFormDrawer({ open, onClose, routes }: TransportAllocationFormDrawerProps) {
  const createTransportAllocation = useCreateTransportAllocation()
  const studentsQuery = useAllStudentsForTransport()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransportAllocationFormValues>({
    resolver: zodResolver(transportAllocationSchema),
    defaultValues: emptyValues,
  })

  const routeId = useWatch({ control, name: 'routeId' })
  const selectedRoute = routes.find((r) => r.id === routeId)

  // The stop picker only makes sense scoped to the chosen route — reset it
  // whenever the route changes so a stale stop from a different route
  // can't be submitted.
  useEffect(() => {
    setValue('stopId', '')
  }, [routeId, setValue])

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: TransportAllocationFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createTransportAllocation.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="Allocate student"
      open={open}
      onClose={handleClose}
      size={440}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createTransportAllocation.isPending} onClick={handleSubmit(onSubmit)}>
            Allocate
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Student" validateStatus={errors.studentId ? 'error' : ''} help={errors.studentId?.message}>
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={studentsQuery.isPending}
                placeholder="Select student"
                optionFilterProp="label"
                options={(studentsQuery.data?.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
                }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Route" validateStatus={errors.routeId ? 'error' : ''} help={errors.routeId?.message}>
          <Controller
            name="routeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                placeholder="Select route"
                optionFilterProp="label"
                options={routes.map((r) => ({ value: r.id, label: r.name }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Stop" validateStatus={errors.stopId ? 'error' : ''} help={errors.stopId?.message}>
          <Controller
            name="stopId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                disabled={!selectedRoute}
                placeholder={selectedRoute ? 'Select stop' : 'Select a route first'}
                optionFilterProp="label"
                options={(selectedRoute?.stops ?? []).map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
