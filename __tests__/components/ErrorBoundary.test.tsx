/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

let shouldThrow = false
const Boom = () => {
  if (shouldThrow) throw new Error('Test crash')
  return <div>All good</div>
}

beforeEach(() => {
  shouldThrow = false
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders fallback UI when child throws', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('resets and shows children after clicking Try Again', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // Stop throwing before reset so re-render succeeds
    shouldThrow = false
    fireEvent.click(screen.getByText('Try Again'))
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows the cat emoji', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('😿')).toBeInTheDocument()
  })
})
