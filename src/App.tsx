import { Flex, Typography } from 'antd'

/**
 * Temporary placeholder — replaced by the router/admin shell in a
 * follow-up commit. Exists so the foundation (theming, providers,
 * tooling) can be verified end-to-end on its own.
 */
function App() {
  return (
    <Flex vertical align="center" justify="center" style={{ minHeight: '100vh' }} gap={8}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        CampusOne
      </Typography.Title>
      <Typography.Text type="secondary">Foundation ready.</Typography.Text>
    </Flex>
  )
}

export default App
