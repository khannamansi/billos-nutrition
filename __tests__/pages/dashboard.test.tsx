/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

import { useUser } from '../../lib/UserContext'
import Dashboard from '../../app/dashboard/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(null) }) as any
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

  it('shows placeholder dots when no profile (guest)', () => {
    render(<Dashboard />)
    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
  })

  it('shows profile data for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ daily_calories: 1800, daily_protein: 140, restrictions: 'vegetarian' }),
    }) as any
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('1800 kcal')).toBeInTheDocument())
    expect(screen.getByText('140g')).toBeInTheDocument()
    expect(screen.getByText('vegetarian')).toBeInTheDocument()
  })

  it('shows "None" for restrictions when not set', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ daily_calories: 2000, daily_protein: 150, restrictions: '' }),
    }) as any
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders Edit Goals link', () => {
    render(<Dashboard />)
    expect(screen.getByText('Edit Goals →')).toBeInTheDocument()
  })
})
