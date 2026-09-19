import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { resetPassword } from '@/services/api/authApi'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/passwordSchemas'
import { ApiError } from '@/types/common'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null)
    try {
      await resetPassword(token, values.newPassword)
      setDone(true)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <Flex vertical align="center" justify="center" style={{ minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 400 }} styles={{ body: { padding: 32 } }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Reset password
        </Typography.Title>

        {!token ? (
          <Alert
            type="error"
            showIcon
            message="This reset link is missing its token."
            description={<Link to="/forgot-password">Request a new one</Link>}
          />
        ) : done ? (
          <>
            <Alert
              type="success"
              showIcon
              message="Your password has been reset. You're signed out of every other session — sign in again with your new password."
            />
            <Button type="primary" size="large" block style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
              Go to sign in
            </Button>
          </>
        ) : (
          <>
            <Typography.Text type="secondary">Choose a new password for your account.</Typography.Text>
            <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate style={{ marginTop: 24 }}>
              {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

              <Form.Item
                label="New password"
                validateStatus={errors.newPassword ? 'error' : ''}
                help={errors.newPassword?.message}
              >
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="new-password"
                      prefix={<LockOutlined />}
                      placeholder="••••••••"
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Confirm new password"
                validateStatus={errors.confirmPassword ? 'error' : ''}
                help={errors.confirmPassword?.message}
              >
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      autoComplete="new-password"
                      prefix={<LockOutlined />}
                      placeholder="••••••••"
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
                Reset password
              </Button>
            </Form>
          </>
        )}
      </Card>
    </Flex>
  )
}
