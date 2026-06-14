/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

jest.mock('@/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

import { supabase } from '../../lib/supabase'
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

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
})

describe('SavedPage', () => {
  it('shows empty state for guest user', async () => {
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('No saved recipes yet')).toBeInTheDocument())
  })

  it('renders saved recipes for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleRecipes, error: null }).then(resolve)
    )
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('Chicken Bowl')).toBeInTheDocument())
    expect(screen.getByText('Cook and serve.')).toBeInTheDocument()
    expect(screen.getByText('Chicken, rice')).toBeInTheDocument()
  })

  it('shows calorie and protein badges', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleRecipes, error: null }).then(resolve)
    )
    render(<SavedPage />)
    await waitFor(() => expect(screen.getByText('🔥 500 kcal')).toBeInTheDocument())
    expect(screen.getByText('💪 40g protein')).toBeInTheDocument()
  })

  it('removes a recipe on delete', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleRecipes, error: null }).then(resolve)
    )
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
