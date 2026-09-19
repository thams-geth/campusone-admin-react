import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Drawer, Form, Select, Space } from 'antd'
import {
  certificateRequestSchema,
  type CertificateRequestFormValues,
} from '@/features/certificates/certificateRequestSchema'
import {
  useAllStudentsForCertificates,
  useCertificateTypesQuery,
  useCreateCertificateRequest,
} from '@/features/certificates/hooks'

interface CertificateRequestFormDrawerProps {
  open: boolean
  onClose: () => void
}

const emptyValues: CertificateRequestFormValues = {
  certificateTypeId: '',
  studentId: '',
}

export function CertificateRequestFormDrawer({ open, onClose }: CertificateRequestFormDrawerProps) {
  const createCertificateRequest = useCreateCertificateRequest()
  const certificateTypesQuery = useCertificateTypesQuery()
  const studentsQuery = useAllStudentsForCertificates()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CertificateRequestFormValues>({
    resolver: zodResolver(certificateRequestSchema),
    defaultValues: emptyValues,
  })

  function handleClose() {
    reset(emptyValues)
    onClose()
  }

  async function onSubmit(values: CertificateRequestFormValues) {
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await createCertificateRequest.mutateAsync(values, { onSuccess: handleClose }).catch(() => undefined)
  }

  return (
    <Drawer
      title="New certificate request"
      open={open}
      onClose={handleClose}
      size={420}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={createCertificateRequest.isPending} onClick={handleSubmit(onSubmit)}>
            Submit request
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>
        <Form.Item label="Student" validateStatus={errors.studentId ? 'error' : ''} help={errors.studentId?.message}>
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                loading={studentsQuery.isPending}
                placeholder="Select student"
                optionFilterProp="label"
                options={(studentsQuery.data?.data ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.firstName} ${s.lastName} (${s.rollNumber})`,
                }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Certificate type"
          validateStatus={errors.certificateTypeId ? 'error' : ''}
          help={errors.certificateTypeId?.message}
        >
          <Controller
            name="certificateTypeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                loading={certificateTypesQuery.isPending}
                placeholder="Select certificate type"
                options={(certificateTypesQuery.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
