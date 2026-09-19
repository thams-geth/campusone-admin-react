import type { ThemeConfig } from 'antd'

/**
 * Central Ant Design theme. Keep this as the single source of truth for
 * brand tokens so a future re-skin (per-tenant branding, white-labeling)
 * only touches this file.
 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#4F46E5',
    colorInfo: '#4F46E5',
    colorLink: '#4F46E5',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorText: '#171331',
    colorTextSecondary: '#6C6784',
    colorBorder: '#E7E3F3',
    colorBorderSecondary: '#F0EDF9',
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    colorBgLayout: '#F6F5FC',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#171331',
      bodyBg: '#F6F5FC',
    },
    Menu: {
      darkItemBg: '#171331',
      darkSubMenuItemBg: '#12102A',
      darkItemSelectedBg: '#4F46E5',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    Table: {
      headerBg: '#FAF9FD',
    },
    Card: {
      borderRadiusLG: 14,
    },
  },
}
