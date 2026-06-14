/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
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

  it('shows Sign In when no user is logged in', async () => {
    render(<Navbar />)
    await waitFor(() => expect(screen.getByText('Sign In')).toBeInTheDocument())
  })

  it('shows Sign Out when user is logged in', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Navbar />)
    await waitFor(() => expect(screen.getByText('Sign Out')).toBeInTheDocument())
  })

  it('calls signOut on Sign Out click', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Navbar />)
    await waitFor(() => expect(screen.getByText('Sign Out')).toBeInTheDocument())
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
