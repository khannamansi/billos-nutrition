/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('@/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ data: undefined, mutate: jest.fn() }),
}))

import useSWR from 'swr'
import { useUser } from '../../lib/UserContext'
import SavedPage from '../../app/saved/page'

const sampleRecipes = [
  {
    id: 'r1',
    name: 'Chicken Bowl',
    calories: 500,
    protein: 40,
    instructions: 'Cook and serve.',
    ingredients: 'Chicken, rice',
    saved_at: '2024-01-01T00:00:00.000Z',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  ;(useSWR as jest.Mock).mockReturnValue({ data: undefined, mutate: jest.fn() })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) }) as any
})

describe('SavedPage', () => {
  it('shows empty state for guest user', () => {
    render(<SavedPage />)
    expect(screen.getByText('No saved recipes yet')).toBeInTheDocument()
  })

  it('renders saved recipes for logged-in user', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    ;(useSWR as jest.Mock).mockReturnValue({ data: sampleRecipes, mutate: jest.fn() })
    render(<SavedPage />)
    expect(screen.getByText('Chicken Bowl')).toBeInTheDocument()
    expect(screen.getByText('Cook and serve.')).toBeInTheDocument()
    expect(screen.getByText('Chicken, rice')).toBeInTheDocument()
  })

  it('shows calorie and protein badges', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    ;(useSWR as jest.Mock).mockReturnValue({ data: sampleRecipes, mutate: jest.fn() })
    render(<SavedPage />)
    expect(screen.getByText('🔥 500 kcal')).toBeInTheDocument()
    expect(screen.getByText('💪 40g protein')).toBeInTheDocument()
  })

  it('removes a recipe on delete', async () => {
    const mockMutate = jest.fn()
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    ;(useSWR as jest.Mock).mockReturnValue({ data: sampleRecipes, mutate: mockMutate })
    render(<SavedPage />)
    fireEvent.click(screen.getByText('🗑️ Remove'))
    await waitFor(() => expect(mockMutate).toHaveBeenCalledWith([], false))
  })

  it('shows Generate Recipes link when empty', () => {
    render(<SavedPage />)
    expect(screen.getByText('Generate Recipes')).toBeInTheDocument()
  })
})
