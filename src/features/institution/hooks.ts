import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import { getInstitution, updateInstitution, type InstitutionUpdateInput } from '@/services/api/institutionApi'

const institutionKey = ['institution'] as const

export function useInstitutionQuery() {
  return useQuery({
    queryKey: institutionKey,
    queryFn: getInstitution,
  })
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: InstitutionUpdateInput) => updateInstitution(input),
    onSuccess: () => {
      message.success('Institution updated')
      void queryClient.invalidateQueries({ queryKey: institutionKey })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update institution'))
    },
  })
}
