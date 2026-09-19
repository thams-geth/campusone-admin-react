import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  addStop,
  createRoute,
  createTransportAllocation,
  createVehicle,
  deleteRoute,
  deleteStop,
  deleteVehicle,
  listRoutes,
  listTransportAllocations,
  listVehicles,
  removeTransportAllocation,
  type ListTransportAllocationsParams,
  type RouteInput,
  type StopInput,
  type TransportAllocationInput,
  type VehicleInput,
} from '@/services/api/transportApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Vehicles ----

export function useVehiclesQuery() {
  return useQuery({ queryKey: ['vehicles', 'list'], queryFn: () => listVehicles() })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: VehicleInput) => createVehicle(input),
    onSuccess: () => {
      message.success('Vehicle added')
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add vehicle'))
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      message.success('Vehicle deleted')
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete vehicle'))
    },
  })
}

// ---- Routes & stops ----

export function useRoutesQuery() {
  return useQuery({ queryKey: ['routes', 'list'], queryFn: () => listRoutes() })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: RouteInput) => createRoute(input),
    onSuccess: () => {
      message.success('Route added')
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add route'))
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteRoute(id),
    onSuccess: () => {
      message.success('Route deleted')
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete route'))
    },
  })
}

export function useAddStop() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ routeId, input }: { routeId: string; input: StopInput }) => addStop(routeId, input),
    onSuccess: () => {
      message.success('Stop added')
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add stop'))
    },
  })
}

export function useDeleteStop() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteStop(id),
    onSuccess: () => {
      message.success('Stop deleted')
      void queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete stop'))
    },
  })
}

// ---- Allocations ----

export function useTransportAllocationsQuery(params: ListTransportAllocationsParams) {
  return useQuery({
    queryKey: ['transport-allocations', 'list', params],
    queryFn: () => listTransportAllocations(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for the allocation form — small, unpaginated-in-practice lookup. */
export function useAllStudentsForTransport() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useCreateTransportAllocation() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: TransportAllocationInput) => createTransportAllocation(input),
    onSuccess: () => {
      message.success('Student allocated')
      void queryClient.invalidateQueries({ queryKey: ['transport-allocations'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to allocate student'))
    },
  })
}

export function useRemoveTransportAllocation() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => removeTransportAllocation(id),
    onSuccess: () => {
      message.success('Allocation removed')
      void queryClient.invalidateQueries({ queryKey: ['transport-allocations'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to remove allocation'))
    },
  })
}
