/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

import { supabase } from '../../lib/supabase'
import Dashboard from '../../app/dashboard/page'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
})

describe('Dashboard', () => {
  it('renders the welcome heading', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('renders all nav cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Get Recipes')).toBeInTheDocument()
    expect(screen.getByText('Pantry & Shopping')).toBeInTheDocument()
    expect(screen.getByText('Saved Recipes')).toBeInTheDocument()
    expect(screen.getByText('Meal History')).toBeInTheDocument()
  })

  it('shows placeholder dots when no profile (guest)', async () => {
    render(<Dashboard />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
  })

  it('shows profile data for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 1800, daily_protein: 140, restrictions: 'vegetarian' },
      error: null,
    })
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('1800 kcal')).toBeInTheDocument())
    expect(screen.getByText('140g')).toBeInTheDocument()
    expect(screen.getByText('vegetarian')).toBeInTheDocument()
  })

  it('shows "None" for restrictions when not set', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 2000, daily_protein: 150, restrictions: '' },
      error: null,
    })
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders Edit Goals link', () => {
    render(<Dashboard />)
    expect(screen.getByText('Edit Goals →')).toBeInTheDocument()
  })
})
