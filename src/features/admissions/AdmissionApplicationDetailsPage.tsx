import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AdmissionStatus, EnrolledStudent, Gender } from '@/services/api/admissionsApi'
import { STATUS_COLOR } from '@/features/admissions/admissionStatus'
import { enrollApplicationSchema, type EnrollApplicationFormValues } from '@/features/admissions/admissionSchema'
import {
  useAdmissionApplicationQuery,
  useAdvanceApplication,
  useAllPrograms,
  useAllSectionsForAdmissions,
  useEnrollApplicant,
  useRejectApplication,
  useWithdrawApplication,
} from '@/features/admissions/hooks'

/** Statuses from which "Advance" is still meaningful — ACCEPTED is the end of the advance chain; ENROLLED is reached only via the enroll form. */
const ADVANCEABLE_STATUSES: AdmissionStatus[] = ['APPLIED', 'DOCUMENT_VERIFICATION', 'SHORTLISTED', 'APPROVED', 'OFFERED']
/** No further lifecycle action applies once an application reaches one of these. */
const TERMINAL_STATUSES: AdmissionStatus[] = ['REJECTED', 'WITHDRAWN', 'ENROLLED']

const enrollEmptyValues: EnrollApplicationFormValues = {
  rollNumber: '',
  gender: 'OTHER',
  sectionId: undefined,
}

export function AdmissionApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { message } = App.useApp()

  const applicationQuery = useAdmissionApplicationQuery(id)
  const programsQuery = useAllPrograms()
  const sectionsQuery = useAllSectionsForAdmissions()
  const advanceApplication = useAdvanceApplication()
  const rejectApplication = useRejectApplication()
  const withdrawApplication = useWithdrawApplication()
  const enrollApplicant = useEnrollApplicant()

  const [reviewAction, setReviewAction] = useState<'advance' | 'reject' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [enrolledStudent, setEnrolledStudent] = useState<EnrolledStudent | undefined>(undefined)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnrollApplicationFormValues>({
    resolver: zodResolver(enrollApplicationSchema),
    defaultValues: enrollEmptyValues,
  })

  const program = useMemo(
    () => programsQuery.data?.data.find((p) => p.id === applicationQuery.data?.programId),
    [programsQuery.data, applicationQuery.data],
  )

  if (applicationQuery.isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (applicationQuery.isError || !applicationQuery.data) {
    return (
      <Card>
        <Typography.Text type="danger">Application not found.</Typography.Text>
      </Card>
    )
  }

  const application = applicationQuery.data
  const canAdvance = ADVANCEABLE_STATUSES.includes(application.status)
  const canRejectOrWithdraw = !TERMINAL_STATUSES.includes(application.status)
  // Once enrollApplicant succeeds, invalidating the query flips the
  // application's own status to ENROLLED — keep showing the card (with its
  // success Alert and "View student" link) using the locally-held
  // enrolledStudent result instead of re-checking status === 'ACCEPTED',
  // or the confirmation would disappear the instant the refetch lands.
  const canEnroll = application.status === 'ACCEPTED' || !!enrolledStudent

  function closeReviewModal() {
    setReviewAction(null)
    setReviewNotes('')
  }

  async function confirmReview() {
    if (!id || !reviewAction) return
    const input = reviewNotes.trim() ? { reviewNotes: reviewNotes.trim() } : undefined
    if (reviewAction === 'advance') {
      await advanceApplication.mutateAsync({ id, input }, { onSuccess: closeReviewModal }).catch(() => undefined)
    } else {
      await rejectApplication.mutateAsync({ id, input }, { onSuccess: closeReviewModal }).catch(() => undefined)
    }
  }

  async function handleWithdraw() {
    if (!id) return
    await withdrawApplication.mutateAsync(id).catch(() => undefined)
  }

  async function onEnrollSubmit(values: EnrollApplicationFormValues) {
    if (!id) return
    const input = { ...values, sectionId: values.sectionId || undefined }
    const student = await enrollApplicant.mutateAsync({ id, input }).catch(() => undefined)
    if (student) {
      setEnrolledStudent(student)
      message.success(`Enrolled as ${student.firstName} ${student.lastName} (${student.rollNumber})`)
      reset(enrollEmptyValues)
    }
  }

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Application details
        </Typography.Title>
        <Space>
          {canAdvance && (
            <Button type="primary" loading={advanceApplication.isPending} onClick={() => setReviewAction('advance')}>
              Advance
            </Button>
          )}
          {canRejectOrWithdraw && (
            <Button danger loading={rejectApplication.isPending} onClick={() => setReviewAction('reject')}>
              Reject
            </Button>
          )}
          {canRejectOrWithdraw && (
            <Popconfirm
              title="Withdraw application"
              description="This cannot be undone."
              onConfirm={handleWithdraw}
              okText="Withdraw"
              okButtonProps={{ danger: true }}
            >
              <Button loading={withdrawApplication.isPending}>Withdraw</Button>
            </Popconfirm>
          )}
        </Space>
      </Flex>

      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {application.firstName} {application.lastName}
            </Typography.Title>
            <Typography.Text type="secondary">{application.email}</Typography.Text>
          </div>
          <Tag color={STATUS_COLOR[application.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
            {application.status.replace(/_/g, ' ')}
          </Tag>
        </Flex>

        <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
          <Descriptions.Item label="Program">{program ? `${program.name} (${program.code})` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{application.phone}</Descriptions.Item>
          <Descriptions.Item label="Date of birth">
            {new Date(application.dateOfBirth).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Applied on">{new Date(application.createdAt).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Review notes" span={2}>
            {application.reviewNotes || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {canEnroll && (
        <Card title="Enroll applicant" style={{ marginTop: 16, maxWidth: 560 }}>
          {enrolledStudent ? (
            <Alert
              type="success"
              showIcon
              message={`Enrolled as ${enrolledStudent.firstName} ${enrolledStudent.lastName} (${enrolledStudent.rollNumber})`}
              action={
                <Link to={`/students/${enrolledStudent.id}`}>
                  <Button size="small" type="primary">
                    View student
                  </Button>
                </Link>
              }
            />
          ) : (
            <form onSubmit={handleSubmit(onEnrollSubmit)} noValidate>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div>
                  <Typography.Text>Roll number</Typography.Text>
                  <Controller
                    name="rollNumber"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="e.g. CSE2026-001" />}
                  />
                  {errors.rollNumber && <Typography.Text type="danger">{errors.rollNumber.message}</Typography.Text>}
                </div>

                <div>
                  <Typography.Text>Gender</Typography.Text>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select<Gender>
                        {...field}
                        style={{ width: '100%' }}
                        options={[
                          { value: 'MALE', label: 'Male' },
                          { value: 'FEMALE', label: 'Female' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                      />
                    )}
                  />
                </div>

                <div>
                  <Typography.Text>Section (optional)</Typography.Text>
                  <Controller
                    name="sectionId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        allowClear
                        style={{ width: '100%' }}
                        loading={sectionsQuery.isPending}
                        options={(sectionsQuery.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
                        placeholder="Select section"
                      />
                    )}
                  />
                </div>

                <Button type="primary" htmlType="submit" loading={enrollApplicant.isPending}>
                  Enroll
                </Button>
              </Space>
            </form>
          )}
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Link to="/admissions">&larr; Back to admissions</Link>
      </div>

      <Modal
        title={reviewAction === 'advance' ? 'Advance application' : 'Reject application'}
        open={reviewAction !== null}
        onCancel={closeReviewModal}
        onOk={confirmReview}
        okText={reviewAction === 'advance' ? 'Advance' : 'Reject'}
        okButtonProps={{ danger: reviewAction === 'reject' }}
        confirmLoading={advanceApplication.isPending || rejectApplication.isPending}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">Review notes (optional)</Typography.Paragraph>
        <Input.TextArea
          rows={3}
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Add a note for this decision"
        />
      </Modal>
    </div>
  )
}
