import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch() {
    // Production logging can be connected here without exposing details to users.
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fatal-error">
        <h1>⚠ Something broke in the universe.</h1>
        <p>{import.meta.env.DEV ? this.state.error.message : 'An unexpected error occurred.'}</p>
        <button type="button" onClick={() => window.location.reload()}>Restart</button>
      </main>
    )
  }
}
