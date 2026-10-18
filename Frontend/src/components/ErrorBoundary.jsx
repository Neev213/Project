import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('3D scene failed:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-slate-950 to-black px-6 text-center text-sm text-white/60">
          The 3D globe could not start on this device. The rest of the app still works.
        </div>
      )
    }
    return this.props.children
  }
}