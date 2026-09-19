import { Descriptions, Modal, Typography } from 'antd'
import type { AuditLog } from '@/services/api/auditApi'
import { formatDateTime } from '@/utils/formatDate'

interface AuditLogDetailsModalProps {
  open: boolean
  onClose: () => void
  entry: AuditLog | undefined
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <Typography.Text type="secondary">—</Typography.Text>
  return (
    <Typography.Text code>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </Typography.Text>
  )
}

export function AuditLogDetailsModal({ open, onClose, entry }: AuditLogDetailsModalProps) {
  return (
    <Modal title="Audit log entry" open={open} onCancel={onClose} footer={null} width={640} destroyOnHidden>
      {entry && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Timestamp">{formatDateTime(entry.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Actor">{entry.actorName}</Descriptions.Item>
          <Descriptions.Item label="Message">{entry.message}</Descriptions.Item>
          <Descriptions.Item label="Entity">
            {entry.entity ? `${entry.entity} · ${entry.entityId ?? '—'}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Action">{entry.action ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Before">
            <JsonBlock value={entry.before} />
          </Descriptions.Item>
          <Descriptions.Item label="After">
            <JsonBlock value={entry.after} />
          </Descriptions.Item>
          <Descriptions.Item label="IP address">{entry.ipAddress ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="User agent">{entry.userAgent ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Request ID">{entry.requestId ?? '—'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  )
}
