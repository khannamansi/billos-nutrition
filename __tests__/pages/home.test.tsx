/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

import { useUser } from '../../lib/UserContext'
import Home from '../../app/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('Home (landing page)', () => {
  it("renders Billo's Nutrition heading", () => {
    render(<Home />)
    expect(screen.getByText("Billo's")).toBeInTheDocument()
  })

  it('renders Sign In link', () => {
    render(<Home />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders Continue as Guest link', () => {
    render(<Home />)
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument()
  })

  it('renders the cat emoji', () => {
    render(<Home />)
    expect(screen.getByText('🐱')).toBeInTheDocument()
  })

  it('redirects to dashboard when user is already logged in', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<Home />)
    await waitFor(() => expect((window as any).location.href).toBe('/dashboard'))
  })

  it('does not redirect when no user is logged in', async () => {
    render(<Home />)
    await waitFor(() => expect(screen.getByText('Sign In')).toBeInTheDocument())
    expect((window as any).location.href).toBe('')
  })
})
