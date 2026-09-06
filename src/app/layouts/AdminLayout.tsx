import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/features/auth/useAuth'
import { NAV_ITEMS } from '@/app/router/navConfig'
import { useBreadcrumbItems } from '@/app/router/breadcrumbs'

const { Header, Sider, Content } = Layout

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, tenant, logout, hasRole } = useAuth()
  const breadcrumbItems = useBreadcrumbItems()

  const visibleNavItems = NAV_ITEMS.filter((item) => hasRole(...item.roles))
  const selectedKey =
    visibleNavItems.find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
    )?.key ?? 'dashboard'

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleNavItems.map((item) => ({ key: item.key, icon: item.icon, label: item.label }))}
          onClick={({ key }) => {
            const item = visibleNavItems.find((navItem) => navItem.key === key)
            if (item) navigate(item.path)
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb items={breadcrumbItems} />

          <Space size={16}>
            <Typography.Text type="secondary">{tenant?.name}</Typography.Text>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'role', label: user?.role.replace('_', ' '), disabled: true },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: () => void logout() },
                ],
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Typography.Text>{user?.name}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
