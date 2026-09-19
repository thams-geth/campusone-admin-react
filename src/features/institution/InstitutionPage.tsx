import { useState } from 'react'
import { Button, Card, Descriptions, Flex, Skeleton, Typography } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { PLATFORM_ADMIN_ROLES } from '@/app/router/navConfig'
import { useAuth } from '@/features/auth/useAuth'
import { formatDateTime } from '@/utils/formatDate'
import { useInstitutionQuery } from '@/features/institution/hooks'
import { InstitutionEditDrawer } from '@/features/institution/InstitutionEditDrawer'

export function InstitutionPage() {
  const { hasRole } = useAuth()
  const canEdit = hasRole(...PLATFORM_ADMIN_ROLES)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const query = useInstitutionQuery()
  const institution = query.data

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Institution
        </Typography.Title>
        {canEdit && (
          <Button type="primary" icon={<EditOutlined />} disabled={!institution} onClick={() => setDrawerOpen(true)}>
            Edit
          </Button>
        )}
      </Flex>

      <Card>
        {query.isPending ? (
          <Skeleton active />
        ) : (
          institution && (
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="Name">{institution.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">{institution.slug}</Descriptions.Item>
              <Descriptions.Item label="Primary color">
                {institution.primaryColor ? (
                  <Flex align="center" gap={8}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: '1px solid rgba(0,0,0,0.15)',
                        background: institution.primaryColor,
                      }}
                    />
                    <Typography.Text>{institution.primaryColor}</Typography.Text>
                  </Flex>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(institution.createdAt)}</Descriptions.Item>
            </Descriptions>
          )
        )}
      </Card>

      {institution && (
        <InstitutionEditDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} institution={institution} />
      )}
    </div>
  )
}
