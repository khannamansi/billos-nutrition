/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ data: undefined }),
}))

import useSWR from 'swr'
import { useUser } from '../../lib/UserContext'
import Dashboard from '../../app/dashboard/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  ;(useSWR as jest.Mock).mockReturnValue({ data: undefined })
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

  it('shows placeholder dots when no profile', () => {
    render(<Dashboard />)
    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
  })

  it('shows profile data when loaded', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    ;(useSWR as jest.Mock).mockReturnValue({ data: { daily_calories: 1800, daily_protein: 140, restrictions: 'vegetarian' } })
    render(<Dashboard />)
    expect(screen.getByText('1800 kcal')).toBeInTheDocument()
    expect(screen.getByText('140g')).toBeInTheDocument()
    expect(screen.getByText('vegetarian')).toBeInTheDocument()
  })

  it('shows "None" for restrictions when not set', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    ;(useSWR as jest.Mock).mockReturnValue({ data: { daily_calories: 2000, daily_protein: 150, restrictions: '' } })
    render(<Dashboard />)
    expect(screen.getByText('2000 kcal')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders Edit Goals link', () => {
    render(<Dashboard />)
    expect(screen.getByText('Edit Goals →')).toBeInTheDocument()
  })
})
