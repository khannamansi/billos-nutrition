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
import RecipesPage from '../../app/recipes/page'

const mockRecipes = [
  {
    name: 'Grilled Chicken',
    calories: 450,
    protein: 35,
    prepTime: '20 minutes',
    ingredients: 'chicken, lemon',
    instructions: 'Grill and serve.',
  },
]

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ recipes: mockRecipes }),
  }) as any
})

describe('RecipesPage', () => {
  it('renders Recipe Generator heading', async () => {
    render(<RecipesPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    expect(screen.getByText('🍳 Recipe Generator')).toBeInTheDocument()
  })

  it('shows 0 kcal for guest (no profile)', async () => {
    render(<RecipesPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    expect(screen.getByText('0 kcal')).toBeInTheDocument()
  })

  it('loads profile data for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 2000, daily_protein: 150, restrictions: 'none' },
      error: null,
    })
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    expect(screen.getByText('150g')).toBeInTheDocument()
  })

  it('does not call fetch for guest user', async () => {
    render(<RecipesPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'eggs' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('generates recipes for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 2000, daily_protein: 150, restrictions: '' },
      error: null,
    })
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'chicken' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    await waitFor(() => expect(screen.getByText('Grilled Chicken')).toBeInTheDocument())
    expect(screen.getByText('🔥 450 kcal')).toBeInTheDocument()
    expect(screen.getByText('Grill and serve.')).toBeInTheDocument()
  })

  it('saves a recipe for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 2000, daily_protein: 150, restrictions: '' },
      error: null,
    })
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'chicken' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    await waitFor(() => expect(screen.getByText('Grilled Chicken')).toBeInTheDocument())
    fireEvent.click(screen.getByText('❤️ Save'))
    await waitFor(() => expect(screen.getByText(/saved to favorites/)).toBeInTheDocument())
  })
})
