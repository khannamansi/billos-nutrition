/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
  },
}))

import { supabase } from '../../lib/supabase'
import Home from '../../app/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
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
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Home />)
    await waitFor(() => expect((window as any).location.href).toBe('/dashboard'))
  })

  it('does not redirect when no user is logged in', async () => {
    render(<Home />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    expect((window as any).location.href).toBe('')
  })
})
