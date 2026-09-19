import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { changePassword } from '@/services/api/authApi'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/passwordSchemas'
import { ApiError } from '@/types/common'

export function ChangePasswordPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null)
    setSuccess(false)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      setSuccess(true)
      reset()
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <Card style={{ maxWidth: 480 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Change password
      </Typography.Title>
      <Typography.Text type="secondary">
        Changing your password signs you out of every other device and session — this one stays
        signed in.
      </Typography.Text>

      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate style={{ marginTop: 24 }}>
        {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}
        {success && (
          <Alert type="success" message="Password changed successfully." showIcon style={{ marginBottom: 16 }} />
        )}

        <Form.Item
          label="Current password"
          validateStatus={errors.currentPassword ? 'error' : ''}
          help={errors.currentPassword?.message}
        >
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder="Current password"
                size="large"
              />
            )}
          />
        </Form.Item>

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
                placeholder="New password"
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
                placeholder="Confirm new password"
                size="large"
              />
            )}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" loading={isSubmitting}>
          Change password
        </Button>
      </Form>
    </Card>
  )
}
