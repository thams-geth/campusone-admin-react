import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Skeleton, Space, Typography } from 'antd'
import { buildFacultySchema, type FacultyFormValues } from '@/features/faculty/facultySchema'
import {
  useAllDepartmentsForFaculty,
  useCreateFaculty,
  useFacultyDetailQuery,
  useUpdateFaculty,
} from '@/features/faculty/hooks'

const emptyValues: FacultyFormValues = {
  name: '',
  email: '',
  password: '',
  employeeCode: '',
  departmentId: '',
  designation: '',
  qualification: '',
  experienceYears: 0,
  joiningDate: '',
  status: 'ACTIVE',
}

export function FacultyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()

  const facultyQuery = useFacultyDetailQuery(id)
  const departmentsQuery = useAllDepartmentsForFaculty()
  const createFaculty = useCreateFaculty()
  const updateFaculty = useUpdateFaculty()
  const submitting = createFaculty.isPending || updateFaculty.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(buildFacultySchema(!isEditing)),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (facultyQuery.data) {
      reset({
        name: facultyQuery.data.name,
        email: facultyQuery.data.email,
        password: '',
        employeeCode: facultyQuery.data.employeeCode,
        departmentId: facultyQuery.data.departmentId,
        designation: facultyQuery.data.designation,
        qualification: facultyQuery.data.qualification ?? '',
        experienceYears: facultyQuery.data.experienceYears,
        joiningDate: facultyQuery.data.joiningDate,
        status: facultyQuery.data.status,
      })
    }
  }, [facultyQuery.data, reset])

  async function onSubmit(values: FacultyFormValues) {
    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (id) {
      const input = {
        name: values.name,
        employeeCode: values.employeeCode,
        departmentId: values.departmentId,
        designation: values.designation,
        qualification: values.qualification || undefined,
        experienceYears: values.experienceYears,
        joiningDate: values.joiningDate,
        status: values.status,
      }
      await updateFaculty.mutateAsync({ id, input }, { onSuccess: () => navigate('/faculty') }).catch(() => undefined)
    } else {
      const input = {
        name: values.name,
        email: values.email!,
        password: values.password!,
        employeeCode: values.employeeCode,
        departmentId: values.departmentId,
        designation: values.designation,
        qualification: values.qualification || undefined,
        experienceYears: values.experienceYears,
        joiningDate: values.joiningDate,
        status: values.status,
      }
      const created = await createFaculty.mutateAsync(input).catch(() => undefined)
      if (created) navigate('/faculty')
    }
  }

  const activeDepartmentOptions = (departmentsQuery.data?.data ?? []).map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }))

  if (isEditing && facultyQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    )
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {isEditing ? 'Edit faculty' : 'Add faculty'}
      </Typography.Title>

      <Card style={{ maxWidth: 720 }}>
        <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Name" htmlFor="name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Employee code"
                htmlFor="employeeCode"
                validateStatus={errors.employeeCode ? 'error' : ''}
                help={errors.employeeCode?.message}
              >
                <Controller
                  name="employeeCode"
                  control={control}
                  render={({ field }) => <Input id="employeeCode" {...field} />}
                />
              </Form.Item>
            </Col>
          </Row>

          {!isEditing && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="Email" htmlFor="email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
                  <Controller name="email" control={control} render={({ field }) => <Input id="email" {...field} type="email" />} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Password"
                  htmlFor="password"
                  validateStatus={errors.password ? 'error' : ''}
                  help={errors.password?.message}
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => <Input.Password id="password" {...field} />}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Department"
                htmlFor="departmentId"
                validateStatus={errors.departmentId ? 'error' : ''}
                help={errors.departmentId?.message}
              >
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="departmentId"
                      loading={departmentsQuery.isPending}
                      options={activeDepartmentOptions}
                      placeholder="Select department"
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Designation"
                htmlFor="designation"
                validateStatus={errors.designation ? 'error' : ''}
                help={errors.designation?.message}
              >
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => <Input id="designation" {...field} placeholder="Assistant Professor" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Qualification" htmlFor="qualification">
                <Controller
                  name="qualification"
                  control={control}
                  render={({ field }) => <Input id="qualification" {...field} placeholder="Ph.D. in Computer Science" />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Experience (years)"
                htmlFor="experienceYears"
                validateStatus={errors.experienceYears ? 'error' : ''}
                help={errors.experienceYears?.message}
              >
                <Controller
                  name="experienceYears"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      id="experienceYears"
                      style={{ width: '100%' }}
                      min={0}
                      max={60}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Joining date"
                htmlFor="joiningDate"
                validateStatus={errors.joiningDate ? 'error' : ''}
                help={errors.joiningDate?.message}
              >
                <Controller
                  name="joiningDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="joiningDate"
                      style={{ width: '100%' }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Status" htmlFor="status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="status"
                      options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditing ? 'Save changes' : 'Add faculty'}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
