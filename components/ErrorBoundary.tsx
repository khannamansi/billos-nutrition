'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
          <div className="text-center p-10 rounded-2xl max-w-md"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div className="text-6xl mb-4">😿</div>
            <h2 className="text-white font-bold text-xl mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">Billo ran into an unexpected error.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-3 rounded-full font-semibold"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Try Again
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
