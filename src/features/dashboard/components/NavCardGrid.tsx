import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Typography } from 'antd'
import { useAuth } from '@/features/auth/useAuth'
import { NAV_GROUPS, NAV_ITEMS, type NavGroup, type NavItem } from '@/app/router/navConfig'

/**
 * Each group gets its own hue so the grid reads as a map, not a wall of
 * identically-coloured tiles — matches the palette in src/app/theme.ts.
 */
const GROUP_ACCENT: Record<NavGroup, { color: string; tint: string }> = {
  Overview: { color: '#4F46E5', tint: '#EEECFC' },
  People: { color: '#2563EB', tint: '#EAF1FF' },
  'Academic Structure': { color: '#7C3AED', tint: '#F3EEFF' },
  Academics: { color: '#4F46E5', tint: '#EEECFC' },
  'Campus Operations': { color: '#0D9488', tint: '#EAF6F4' },
  Administration: { color: '#B45309', tint: '#FFF3E8' },
}

/**
 * Replaces the left sidebar as the primary way to get around the app (see
 * AdminLayout's SHOW_LEFT_NAV) — every section the caller's role can reach,
 * grouped and shown as tappable cards instead of a persistent nav list.
 */
export function NavCardGrid() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const groupedItems = useMemo(() => {
    const byGroup = new Map<NavGroup, NavItem[]>()
    for (const item of NAV_ITEMS) {
      // The dashboard card grid lives on the dashboard itself, so it has no card for "Dashboard".
      if (item.key === 'dashboard') continue
      if (!hasRole(...item.roles)) continue
      const existing = byGroup.get(item.group)
      if (existing) existing.push(item)
      else byGroup.set(item.group, [item])
    }
    return NAV_GROUPS.map((group) => ({ group, items: byGroup.get(group) ?? [] })).filter(
      (section) => section.items.length > 0,
    )
  }, [hasRole])

  return (
    <div>
      {groupedItems.map(({ group, items }) => {
        const accent = GROUP_ACCENT[group]
        return (
          <div key={group} style={{ marginBottom: 24 }}>
            <Typography.Text
              strong
              style={{
                display: 'block',
                marginBottom: 12,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: accent.color,
              }}
            >
              {group}
            </Typography.Text>
            <Row gutter={[12, 12]}>
              {items.map((item) => (
                <Col key={item.key} xs={12} sm={8} md={6} lg={4}>
                  <Card
                    hoverable
                    onClick={() => navigate(item.path)}
                    styles={{ body: { padding: 16, textAlign: 'center' } }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: accent.tint,
                        color: accent.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        margin: '0 auto 10px',
                      }}
                    >
                      {item.icon}
                    </div>
                    <Typography.Text style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )
      })}
    </div>
  )
}
