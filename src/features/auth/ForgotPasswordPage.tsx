import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { forgotPassword } from '@/services/api/authApi'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/passwordSchemas'
import { ApiError } from '@/types/common'

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<{ message: string; resetToken?: string } | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null)
    try {
      const response = await forgotPassword(values.email)
      setResult(response)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <Flex vertical align="center" justify="center" style={{ minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 400 }} styles={{ body: { padding: 32 } }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Forgot password
        </Typography.Title>
        <Typography.Text type="secondary">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </Typography.Text>

        {result ? (
          <div style={{ marginTop: 24 }}>
            <Alert type="success" showIcon message={result.message} />
            {result.resetToken && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="Dev-only shortcut"
                description={
                  <span>
                    No email provider is wired up in this environment, so here&apos;s the reset link directly:{' '}
                    <Link to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}>
                      Reset your password
                    </Link>
                  </span>
                }
              />
            )}
            <div style={{ marginTop: 16 }}>
              <Link to="/login">Back to sign in</Link>
            </div>
          </div>
        ) : (
          <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate style={{ marginTop: 24 }}>
            {formError && (
              <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />
            )}

            <Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
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

            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting} block>
              Send reset link
            </Button>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/login">Back to sign in</Link>
            </div>
          </Form>
        )}
      </Card>
    </Flex>
  )
}
