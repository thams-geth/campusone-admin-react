import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
        justify="space-between"
        flex={1}
        style={{
          display: 'none',
          background:
            'radial-gradient(600px 380px at 15% 10%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(500px 400px at 100% 100%, rgba(124,58,237,0.55), transparent 60%), linear-gradient(155deg, #4F46E5 0%, #372F87 60%, #201B4D 100%)',
          color: '#fff',
          padding: 56,
        }}
        className="login-brand-panel"
      >
        <Flex align="center" gap={10}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: '#fff' }} />
          <Typography.Text strong style={{ color: '#fff', fontSize: 19 }}>
            CampusOne
          </Typography.Text>
        </Flex>

        <div style={{ maxWidth: 380 }}>
          <Typography.Title level={2} style={{ color: '#fff', marginBottom: 14 }}>
            Every college, one operating system.
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14.5, maxWidth: 340 }}>
            Admissions to alumni — attendance, fees, timetable and exams running on one
            tenant-isolated platform.
          </Typography.Paragraph>

          <Flex gap={28} style={{ marginTop: 28 }}>
            <div>
              <Typography.Text strong style={{ color: '#fff', fontSize: 22, display: 'block' }}>
                38
              </Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Modules
              </Typography.Text>
            </div>
            <div>
              <Typography.Text strong style={{ color: '#fff', fontSize: 22, display: 'block' }}>
                10
              </Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Roles
              </Typography.Text>
            </div>
          </Flex>
        </div>
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

          <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate style={{ marginTop: 24 }}>
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
              style={{ marginBottom: 8 }}
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

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
              Sign in
            </Button>
          </Form>

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
