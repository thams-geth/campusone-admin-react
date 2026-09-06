import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { loginSchema, type LoginFormValues } from '@/features/auth/loginSchema'
import { DemoCredentials } from '@/features/auth/DemoCredentials'
import type { LoginRedirectState } from '@/features/auth/RouteGuards'
import { ApiError } from '@/types/common'

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status === 'authenticated') {
    const redirectTo = (location.state as LoginRedirectState | null)?.from?.pathname ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    try {
      await login(values)
      const redirectTo = (location.state as LoginRedirectState | null)?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <Flex style={{ minHeight: '100vh' }}>
      <Flex
        vertical
        justify="center"
        flex={1}
        style={{
          display: 'none',
          background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
          color: '#fff',
          padding: '64px',
        }}
        className="login-brand-panel"
      >
        <Typography.Title level={1} style={{ color: '#fff', marginBottom: 16 }}>
          CampusOne
        </Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: 420 }}>
          One platform for every college — admissions, academics, fees, and more, enabled the
          moment you need them.
        </Typography.Paragraph>
      </Flex>

      <style>{`
        @media (min-width: 900px) {
          .login-brand-panel { display: flex !important; }
        }
      `}</style>

      <Flex vertical align="center" justify="center" flex={1} style={{ padding: 24 }}>
        <Card style={{ width: '100%', maxWidth: 400 }} styles={{ body: { padding: 32 } }}>
          <Typography.Title level={3} style={{ marginTop: 0 }}>
            Sign in
          </Typography.Title>
          <Typography.Text type="secondary">Welcome back to your admin console.</Typography.Text>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ marginTop: 24 }}>
            {formError && (
              <Alert
                type="error"
                message={formError}
                showIcon
                style={{ marginBottom: 16 }}
                data-testid="login-error"
              />
            )}

            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    autoComplete="username"
                    prefix={<MailOutlined />}
                    placeholder="you@college.edu"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    autoComplete="current-password"
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
              Sign in
            </Button>
          </form>

          <div style={{ marginTop: 16 }}>
            <DemoCredentials
              onSelect={(email, password) => {
                setValue('email', email)
                setValue('password', password)
                setFormError(null)
              }}
            />
          </div>
        </Card>
      </Flex>
    </Flex>
  )
}
