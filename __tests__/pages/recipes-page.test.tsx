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

function makeStreamingMock(payload: object) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const mockReader = {
    read: jest.fn()
      .mockResolvedValueOnce({ done: false, value: encoded })
      .mockResolvedValue({ done: true, value: undefined }),
  }
  return { ok: true, body: { getReader: () => mockReader } }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => null })
    if (url === '/api/recipes/saved') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    return Promise.resolve(makeStreamingMock({ recipes: mockRecipes }))
  }) as any
})

describe('RecipesPage', () => {
  it('renders Recipe Generator heading', () => {
    render(<RecipesPage />)
    expect(screen.getByText('🍳 Recipe Generator')).toBeInTheDocument()
  })

  it('shows 0 kcal for guest (no profile)', () => {
    render(<RecipesPage />)
    expect(screen.getByText('0 kcal')).toBeInTheDocument()
  })

  it('loads profile data for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: 'none' }) })
      if (url === '/api/recipes/saved') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
      return Promise.resolve(makeStreamingMock({ recipes: mockRecipes }))
    }) as any
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    expect(screen.getByText('150g')).toBeInTheDocument()
  })

  it('does not call fetch for guest user', () => {
    render(<RecipesPage />)
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'eggs' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    expect(global.fetch).not.toHaveBeenCalledWith('/api/recipes', expect.anything())
  })

  it('generates recipes for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: '' }) })
      if (url === '/api/recipes/saved') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
      return Promise.resolve(makeStreamingMock({ recipes: mockRecipes }))
    }) as any
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'chicken' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    await waitFor(() => expect(screen.getByText('Grilled Chicken')).toBeInTheDocument())
    expect(screen.getByText('🔥 450 kcal')).toBeInTheDocument()
    expect(screen.getByText('Grill and serve.')).toBeInTheDocument()
  })

  it('saves a recipe for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: '' }) })
      if (url === '/api/recipes/saved') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
      return Promise.resolve(makeStreamingMock({ recipes: mockRecipes }))
    }) as any
    render(<RecipesPage />)
    await waitFor(() => expect(screen.getByText('2000 kcal')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText(/chicken breast/), { target: { value: 'chicken' } })
    fireEvent.click(screen.getByText('✨ Generate Recipes'))
    await waitFor(() => expect(screen.getByText('Grilled Chicken')).toBeInTheDocument())
    fireEvent.click(screen.getByText('❤️ Save'))
    await waitFor(() => expect(screen.getByText('✅ Saved')).toBeInTheDocument())
  })
})
