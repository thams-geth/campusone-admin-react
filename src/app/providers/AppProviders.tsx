import { useState, type PropsWithChildren } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { themeConfig } from '@/app/theme'
import { ApiError } from '@/types/common'
import { notifySessionExpired } from '@/services/authEvents'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ScrollManager } from '@/app/router/ScrollManager'

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          notifySessionExpired()
        }
      },
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ScrollManager />
            <AuthProvider>{children}</AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
