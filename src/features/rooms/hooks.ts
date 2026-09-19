import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createRoom,
  deleteRoom,
  listRooms,
  updateRoom,
  type RoomInput,
  type ListRoomsParams,
} from '@/services/api/roomsApi'

const roomsKey = (params: ListRoomsParams) => ['rooms', 'list', params] as const

export function useRoomsQuery(params: ListRoomsParams) {
  return useQuery({
    queryKey: roomsKey(params),
    queryFn: () => listRooms(params),
    placeholderData: (previous) => previous,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: RoomInput) => createRoom(input),
    onSuccess: () => {
      message.success('Room created')
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create room'))
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RoomInput }) => updateRoom(id, input),
    onSuccess: () => {
      message.success('Room updated')
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update room'))
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      message.success('Room deleted')
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete room'))
    },
  })
}
