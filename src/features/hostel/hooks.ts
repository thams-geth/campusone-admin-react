import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createHostel,
  createHostelAllocation,
  createHostelRoom,
  deleteHostel,
  deleteHostelRoom,
  listHostelAllocations,
  listHostelRooms,
  listHostels,
  vacateAllocation,
  type HostelAllocationInput,
  type HostelInput,
  type HostelRoomInput,
  type ListHostelAllocationsParams,
  type ListHostelRoomsParams,
} from '@/services/api/hostelApi'
import { listStudents } from '@/services/api/studentsApi'

// ---- Hostels ----

export function useHostelsQuery() {
  return useQuery({ queryKey: ['hostels', 'list'], queryFn: () => listHostels() })
}

export function useCreateHostel() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: HostelInput) => createHostel(input),
    onSuccess: () => {
      message.success('Hostel added')
      void queryClient.invalidateQueries({ queryKey: ['hostels'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add hostel'))
    },
  })
}

export function useDeleteHostel() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteHostel(id),
    onSuccess: () => {
      message.success('Hostel deleted')
      void queryClient.invalidateQueries({ queryKey: ['hostels'] })
      void queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete hostel'))
    },
  })
}

// ---- Rooms ----

export function useHostelRoomsQuery(params: ListHostelRoomsParams) {
  return useQuery({
    queryKey: ['hostel-rooms', 'list', params],
    queryFn: () => listHostelRooms(params),
    placeholderData: (previous) => previous,
  })
}

/** All rooms across hostels, for resolving room numbers/allocation pickers — small, unpaginated-in-practice lookup. */
export function useAllHostelRooms() {
  return useQuery({
    queryKey: ['hostel-rooms', 'all'],
    queryFn: () => listHostelRooms({ page: 1, pageSize: 100 }),
  })
}

export function useCreateHostelRoom() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: HostelRoomInput) => createHostelRoom(input),
    onSuccess: () => {
      message.success('Room added')
      void queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add room'))
    },
  })
}

export function useDeleteHostelRoom() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteHostelRoom(id),
    onSuccess: () => {
      message.success('Room deleted')
      void queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete room'))
    },
  })
}

// ---- Allocations ----

export function useHostelAllocationsQuery(params: ListHostelAllocationsParams) {
  return useQuery({
    queryKey: ['hostel-allocations', 'list', params],
    queryFn: () => listHostelAllocations(params),
    placeholderData: (previous) => previous,
  })
}

/** Student picker for the allocation form — small, unpaginated-in-practice lookup. */
export function useAllStudentsForHostel() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => listStudents({ page: 1, pageSize: 100 }),
  })
}

export function useCreateHostelAllocation() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: HostelAllocationInput) => createHostelAllocation(input),
    onSuccess: () => {
      message.success('Student allocated')
      void queryClient.invalidateQueries({ queryKey: ['hostel-allocations'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to allocate student'))
    },
  })
}

export function useVacateAllocation() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => vacateAllocation(id),
    onSuccess: () => {
      message.success('Allocation vacated')
      void queryClient.invalidateQueries({ queryKey: ['hostel-allocations'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to vacate allocation'))
    },
  })
}
