import { Button, Flex, Typography } from 'antd'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Temporary — replaced by the full router/admin shell in a follow-up
 * commit. Shows the login page when signed out, and a minimal
 * placeholder (rather than a blank screen) once authenticated, so this
 * commit is reviewable end-to-end on its own.
 */
function App() {
  const { status, user, logout } = useAuth()

  if (status !== 'authenticated') {
    return <LoginPage />
  }

  return (
    <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: '100vh' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Signed in as {user?.name} ({user?.role})
      </Typography.Title>
      <Typography.Text type="secondary">Admin shell and routing land in the next commit.</Typography.Text>
      <Button onClick={() => void logout()}>Sign out</Button>
    </Flex>
  )
}

export default App
