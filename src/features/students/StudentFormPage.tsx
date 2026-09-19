import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Skeleton, Space, Typography } from 'antd'
import { studentSchema, type StudentFormValues } from '@/features/students/studentSchema'
import { useAllDepartments, useCreateStudent, useStudentQuery, useUpdateStudent } from '@/features/students/hooks'

const emptyValues: StudentFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  rollNumber: '',
  departmentId: '',
  gender: 'other',
  dateOfBirth: '',
  admissionDate: '',
  status: 'active',
  guardianName: '',
  guardianPhone: '',
  address: '',
}

export function StudentFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()

  const studentQuery = useStudentQuery(id)
  const departmentsQuery = useAllDepartments()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const submitting = createStudent.isPending || updateStudent.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (studentQuery.data) {
      reset({
        firstName: studentQuery.data.firstName,
        lastName: studentQuery.data.lastName,
        email: studentQuery.data.email,
        phone: studentQuery.data.phone,
        rollNumber: studentQuery.data.rollNumber,
        departmentId: studentQuery.data.departmentId,
        gender: studentQuery.data.gender,
        dateOfBirth: studentQuery.data.dateOfBirth,
        admissionDate: studentQuery.data.admissionDate,
        status: studentQuery.data.status,
        guardianName: studentQuery.data.guardianName ?? '',
        guardianPhone: studentQuery.data.guardianPhone ?? '',
        address: studentQuery.data.address ?? '',
      })
    }
  }, [studentQuery.data, reset])

  async function onSubmit(values: StudentFormValues) {
    const input = {
      ...values,
      guardianName: values.guardianName || undefined,
      guardianPhone: values.guardianPhone || undefined,
      address: values.address || undefined,
    }

    // Errors surface via the mutations' onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    if (id) {
      await updateStudent
        .mutateAsync({ id, input }, { onSuccess: () => navigate(`/students/${id}`) })
        .catch(() => undefined)
    } else {
      const created = await createStudent.mutateAsync(input).catch(() => undefined)
      if (created) navigate(`/students/${created.id}`)
    }
  }

  const activeDepartmentOptions = (departmentsQuery.data?.data ?? [])
    .filter((d) => d.status === 'active' || d.id === studentQuery.data?.departmentId)
    .map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))

  if (isEditing && studentQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    )
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {isEditing ? 'Edit student' : 'Add student'}
      </Typography.Title>

      <Card style={{ maxWidth: 720 }}>
        <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="First name" htmlFor="firstName" validateStatus={errors.firstName ? 'error' : ''} help={errors.firstName?.message}>
                <Controller name="firstName" control={control} render={({ field }) => <Input id="firstName" {...field} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Last name" htmlFor="lastName" validateStatus={errors.lastName ? 'error' : ''} help={errors.lastName?.message}>
                <Controller name="lastName" control={control} render={({ field }) => <Input id="lastName" {...field} />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Email" htmlFor="email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
                <Controller name="email" control={control} render={({ field }) => <Input id="email" {...field} type="email" />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Phone" htmlFor="phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
                <Controller name="phone" control={control} render={({ field }) => <Input id="phone" {...field} placeholder="+91 9000000000" />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Roll number"
                htmlFor="rollNumber"
                validateStatus={errors.rollNumber ? 'error' : ''}
                help={errors.rollNumber?.message}
              >
                <Controller name="rollNumber" control={control} render={({ field }) => <Input id="rollNumber" {...field} />} />
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Gender" htmlFor="gender" validateStatus={errors.gender ? 'error' : ''} help={errors.gender?.message}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="gender"
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
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
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'alumni', label: 'Alumni' },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Date of birth"
                htmlFor="dateOfBirth"
                validateStatus={errors.dateOfBirth ? 'error' : ''}
                help={errors.dateOfBirth?.message}
              >
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="dateOfBirth"
                      style={{ width: '100%' }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                      maxDate={dayjs()}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Admission date"
                htmlFor="admissionDate"
                validateStatus={errors.admissionDate ? 'error' : ''}
                help={errors.admissionDate?.message}
              >
                <Controller
                  name="admissionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="admissionDate"
                      style={{ width: '100%' }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                      maxDate={dayjs()}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Guardian name" htmlFor="guardianName">
                <Controller name="guardianName" control={control} render={({ field }) => <Input id="guardianName" {...field} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Guardian phone"
                htmlFor="guardianPhone"
                validateStatus={errors.guardianPhone ? 'error' : ''}
                help={errors.guardianPhone?.message}
              >
                <Controller name="guardianPhone" control={control} render={({ field }) => <Input id="guardianPhone" {...field} />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Address" htmlFor="address">
            <Controller name="address" control={control} render={({ field }) => <Input.TextArea id="address" {...field} rows={2} />} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditing ? 'Save changes' : 'Add student'}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
