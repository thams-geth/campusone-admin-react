import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { errorMessage } from '@/utils/errorMessage'
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type CreateApiKeyInput,
} from '@/services/api/apiKeysApi'
import {
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookDeliveries,
  listWebhookEndpoints,
  updateWebhookEndpoint,
  type CreateWebhookEndpointInput,
  type ListDeliveriesParams,
  type UpdateWebhookEndpointInput,
} from '@/services/api/webhooksApi'
import {
  listIntegrations,
  upsertIntegration,
  type IntegrationProvider,
  type UpsertIntegrationConfigInput,
} from '@/services/api/integrationsApi'

// ---- API keys ----

export function useApiKeysQuery() {
  return useQuery({ queryKey: ['api-keys', 'list'], queryFn: () => listApiKeys() })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => createApiKey(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to create API key'))
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      message.success('API key revoked')
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to revoke API key'))
    },
  })
}

// ---- Webhooks ----

export function useWebhookEndpointsQuery() {
  return useQuery({ queryKey: ['webhook-endpoints', 'list'], queryFn: () => listWebhookEndpoints() })
}

export function useCreateWebhookEndpoint() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (input: CreateWebhookEndpointInput) => createWebhookEndpoint(input),
    onSuccess: () => {
      message.success('Webhook endpoint added')
      void queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to add webhook endpoint'))
    },
  })
}

export function useUpdateWebhookEndpoint() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWebhookEndpointInput }) => updateWebhookEndpoint(id, input),
    onSuccess: () => {
      message.success('Webhook endpoint updated')
      void queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to update webhook endpoint'))
    },
  })
}

export function useDeleteWebhookEndpoint() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: (id: string) => deleteWebhookEndpoint(id),
    onSuccess: () => {
      message.success('Webhook endpoint deleted')
      void queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to delete webhook endpoint'))
    },
  })
}

export function useWebhookDeliveriesQuery(endpointId: string | undefined, params: ListDeliveriesParams = {}) {
  return useQuery({
    queryKey: ['webhook-deliveries', endpointId, params],
    queryFn: () => listWebhookDeliveries(endpointId as string, params),
    enabled: !!endpointId,
  })
}

// ---- Integrations ----

export function useIntegrationsQuery() {
  return useQuery({ queryKey: ['integrations', 'list'], queryFn: () => listIntegrations() })
}

export function useUpsertIntegration() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  return useMutation({
    mutationFn: ({ provider, input }: { provider: IntegrationProvider; input: UpsertIntegrationConfigInput }) =>
      upsertIntegration(provider, input),
    onSuccess: () => {
      message.success('Integration settings saved')
      void queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (error) => {
      message.error(errorMessage(error, 'Failed to save integration settings'))
    },
  })
}
