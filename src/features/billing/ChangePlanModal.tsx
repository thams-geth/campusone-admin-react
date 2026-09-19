import { useState } from 'react'
import { Button, Card, Empty, Flex, Modal, Radio, Skeleton, Typography } from 'antd'
import type { Plan } from '@/services/api/billingApi'
import { usePlansQuery, useSetSubscription } from '@/features/billing/hooks'

interface ChangePlanModalProps {
  open: boolean
  onClose: () => void
  currentPlanId?: string
}

function PlanCard({ plan, selected }: { plan: Plan; selected: boolean }) {
  return (
    <Card size="small" style={{ borderColor: selected ? '#1677ff' : undefined }}>
      <Flex justify="space-between" align="flex-start">
        <div>
          <Typography.Text strong>{plan.name}</Typography.Text>
          {plan.description && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {plan.description}
              </Typography.Text>
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Up to {plan.studentLimit.toLocaleString()} students · {plan.facultyLimit.toLocaleString()} faculty
            </Typography.Text>
          </div>
        </div>
        <Typography.Text strong>₹{plan.priceMonthly.toLocaleString()}/mo</Typography.Text>
      </Flex>
    </Card>
  )
}

export function ChangePlanModal({ open, onClose, currentPlanId }: ChangePlanModalProps) {
  const plansQuery = usePlansQuery()
  const setSubscription = useSetSubscription()
  const [planId, setPlanId] = useState<string | undefined>(currentPlanId)

  async function handleConfirm() {
    if (!planId) return
    // Errors surface via the mutation's onError (message.error) already —
    // caught here only so the rejection doesn't propagate as unhandled.
    await setSubscription.mutateAsync({ planId }, { onSuccess: onClose }).catch(() => undefined)
  }

  return (
    <Modal
      title="Change plan"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={setSubscription.isPending} disabled={!planId} onClick={handleConfirm}>
            Confirm plan
          </Button>
        </Flex>
      }
    >
      {plansQuery.isPending ? (
        <Skeleton active />
      ) : !plansQuery.data || plansQuery.data.length === 0 ? (
        <Empty description="No plans available" />
      ) : (
        <Radio.Group
          style={{ width: '100%' }}
          value={planId}
          onChange={(e) => setPlanId(e.target.value as string)}
        >
          <Flex vertical gap={8}>
            {plansQuery.data.map((plan) => (
              <Radio key={plan.id} value={plan.id} style={{ width: '100%' }}>
                <PlanCard plan={plan} selected={planId === plan.id} />
              </Radio>
            ))}
          </Flex>
        </Radio.Group>
      )}
    </Modal>
  )
}
