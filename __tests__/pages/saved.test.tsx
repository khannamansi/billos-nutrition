/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('@/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

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
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as any
})

describe('SavedPage', () => {
  it('shows empty state for guest user', async () => {
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('No saved recipes yet')).toBeInTheDocument())
  })

  it('renders saved recipes for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(sampleRecipes) }) as any
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('Chicken Bowl')).toBeInTheDocument())
    expect(screen.getByText('Cook and serve.')).toBeInTheDocument()
    expect(screen.getByText('Chicken, rice')).toBeInTheDocument()
  })

  it('shows calorie and protein badges', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(sampleRecipes) }) as any
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('🔥 500 kcal')).toBeInTheDocument())
    expect(screen.getByText('💪 40g protein')).toBeInTheDocument()
  })

  it('removes a recipe on delete', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(sampleRecipes) })
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) }) as any
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('Chicken Bowl')).toBeInTheDocument())
    fireEvent.click(screen.getByText('🗑️ Remove'))
    await waitFor(() => expect(screen.queryByText('Chicken Bowl')).not.toBeInTheDocument())
  })

  it('shows Generate Recipes link when empty', async () => {
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('Generate Recipes')).toBeInTheDocument())
  })
})
