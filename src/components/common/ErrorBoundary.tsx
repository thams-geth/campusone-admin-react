import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Last line of defense against a render-time crash. Without this, an
 * uncaught error anywhere in the tree unmounts the whole app and leaves
 * a blank white page — which is a much worse failure mode for an admin
 * console than a "something went wrong" screen with a reload button.
 */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in component tree:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred. Reloading usually fixes it."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      )
    }

    return this.props.children
  }
}
