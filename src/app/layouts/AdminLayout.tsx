import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, Space, Typography } from 'antd'
import { KeyOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { NAV_ITEMS } from '@/app/router/navConfig'
import { useBreadcrumbItems } from '@/app/router/breadcrumbs'
import { GlobalSearch } from '@/features/search/GlobalSearch'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

// The left sidebar (desktop Sider / mobile Drawer) is replaced for now by
// the dashboard's card-based navigation (NavCardGrid) — flip this back to
// `true` to restore it. The Sider/Drawer/hamburger implementation below is
// otherwise untouched, kept ready rather than deleted.
const SHOW_LEFT_NAV: boolean = false

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, tenant, logout, hasRole } = useAuth()
  const breadcrumbItems = useBreadcrumbItems()
  const screens = useBreakpoint()
  // Below `lg` the permanent Sider gives way to a Drawer — same breakpoint
  // the Sider itself used to collapse to icon-only, but on a phone/small
  // tablet an icon rail still eats real content width, so it's hidden
  // entirely in favor of a hamburger-triggered overlay.
  const isMobile = !screens.lg

  const visibleNavItems = NAV_ITEMS.filter((item) => hasRole(...item.roles))
  const selectedKey =
    visibleNavItems.find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
    )?.key ?? 'dashboard'

  const navMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={visibleNavItems.map((item) => ({ key: item.key, icon: item.icon, label: item.label }))}
      onClick={({ key }) => {
        const item = visibleNavItems.find((navItem) => navItem.key === key)
        if (item) navigate(item.path)
        // The drawer would otherwise stay open behind the next page — closing
        // it here (the actual navigation trigger) instead of reacting to the
        // route change keeps this a plain event handler, not an effect.
        setMobileNavOpen(false)
      }}
    />
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {SHOW_LEFT_NAV && !isMobile && (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" breakpoint="lg">
          <div
            style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: collapsed ? 16 : 18,
              letterSpacing: -0.5,
            }}
          >
            {collapsed ? 'C1' : 'CampusOne'}
          </div>
          {navMenu}
        </Sider>
      )}

      {SHOW_LEFT_NAV && isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setMobileNavOpen(false)}
          open={mobileNavOpen}
          width={220}
          styles={{ body: { padding: 0, background: '#171331' } }}
        >
          <div
            style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: -0.5,
            }}
          >
            CampusOne
          </div>
          {navMenu}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 16,
            borderBottom: '1px solid #E7E3F3',
          }}
        >
          {SHOW_LEFT_NAV && isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              style={{ flexShrink: 0 }}
            />
          )}

          {/* With the sidebar hidden, this is the one persistent way back to the
              dashboard's nav card grid from anywhere in the app. */}
          <Typography.Text
            strong
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', flexShrink: 0, fontSize: 16, letterSpacing: -0.5, color: '#4F46E5' }}
          >
            CampusOne
          </Typography.Text>

          {!isMobile && (
            <div style={{ flexShrink: 0 }}>
              <Breadcrumb items={breadcrumbItems} />
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center', minWidth: 0 }}>
            <GlobalSearch />
          </div>

          <Space size={isMobile ? 8 : 16} style={{ flexShrink: 0 }}>
            {!isMobile && <Typography.Text type="secondary">{tenant?.name}</Typography.Text>}
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'role', label: user?.role.replace('_', ' '), disabled: true },
                  { type: 'divider' },
                  {
                    key: 'change-password',
                    icon: <KeyOutlined />,
                    label: 'Change password',
                    onClick: () => navigate('/account/change-password'),
                  },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: () => void logout() },
                ],
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                {!isMobile && <Typography.Text>{user?.name}</Typography.Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: isMobile ? 12 : 24, minWidth: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
