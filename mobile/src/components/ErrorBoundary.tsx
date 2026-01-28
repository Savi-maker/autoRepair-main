import React from 'react'

type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#ffb3b3' }}>
          <h2>CoĹ› poszĹ‚o nie tak na tej stronie.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          <p>SprawdĹş konsolÄ™ deweloperskÄ… (DevTools) po wiÄ™cej szczegĂłĹ‚Ăłw.</p>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}

