/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn() },
  },
}))

import { useUser } from '../../lib/UserContext'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({})
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('Navbar', () => {
  it('renders the logo', () => {
    render(<Navbar />)
    expect(screen.getByText("Billo's")).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<Navbar />)
    expect(screen.getByText('Recipes')).toBeInTheDocument()
    expect(screen.getByText('Shopping')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('shows Sign In when no user is logged in', () => {
    render(<Navbar />)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('shows Sign Out when user is logged in', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<Navbar />)
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls signOut on Sign Out click', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<Navbar />)
    fireEvent.click(screen.getByText('Sign Out'))
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled())
  })

  it('highlights the active link', () => {
    render(<Navbar active="recipes" />)
    expect(screen.getByText('Recipes')).toHaveStyle({ color: '#D4AF37' })
  })

  it('non-active links use white', () => {
    render(<Navbar active="recipes" />)
    expect(screen.getByText('Shopping')).toHaveStyle({ color: '#ffffff' })
  })
})
