import type { ThemeConfig } from 'antd'

/**
 * Central Ant Design theme. Keep this as the single source of truth for
 * brand tokens so a future re-skin (per-tenant branding, white-labeling)
 * only touches this file.
 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#4338ca',
    colorInfo: '#4338ca',
    colorLink: '#4338ca',
    colorSuccess: '#15803d',
    colorWarning: '#b45309',
    colorError: '#b91c1c',
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    colorBgLayout: '#f5f6fa',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#101127',
      bodyBg: '#f5f6fa',
    },
    Menu: {
      darkItemBg: '#101127',
      darkSubMenuItemBg: '#0b0c1e',
      darkItemSelectedBg: '#4338ca',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    Table: {
      headerBg: '#fafafa',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
}
