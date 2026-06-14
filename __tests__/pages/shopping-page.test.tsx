/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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

jest.mock('../../components/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}))

import { supabase } from '../../lib/supabase'
import ShoppingPage from '../../app/shopping/page'

const mockItems = [
  { name: 'Chicken Breast', category: 'Proteins', checked: false },
  { name: 'Broccoli', category: 'Vegetables', checked: false },
]

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ items: mockItems }),
  }) as any
})

describe('ShoppingPage — Shopping tab', () => {
  it('renders Shopping List tab by default', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(screen.getByText('Shopping List')).toBeInTheDocument())
  })

  it('shows guest prompt when guest tries to generate', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('✨ Generate Shopping List'))
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument())
  })

  it('generates list for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single
      .mockResolvedValueOnce({ data: { daily_calories: 2000, daily_protein: 150, restrictions: '' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    render(<ShoppingPage />)
    // wait for full loadData (then = pantry query, the last async call)
    await waitFor(() => expect(mockBuilder.then).toHaveBeenCalled())
    fireEvent.click(screen.getByText('✨ Generate Shopping List'))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    expect(screen.getByText('Broccoli')).toBeInTheDocument()
  })

  it('toggles a shopping item as checked', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single
      .mockResolvedValueOnce({ data: { daily_calories: 2000, daily_protein: 150, restrictions: '' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    render(<ShoppingPage />)
    await waitFor(() => expect(mockBuilder.then).toHaveBeenCalled())
    fireEvent.click(screen.getByText('✨ Generate Shopping List'))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken Breast').closest('div')!)
    expect(screen.getByText('1 items remaining')).toBeInTheDocument()
  })

  it('saves shopping list', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single
      .mockResolvedValueOnce({ data: { daily_calories: 2000, daily_protein: 150, restrictions: '' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    render(<ShoppingPage />)
    await waitFor(() => expect(mockBuilder.then).toHaveBeenCalled())
    fireEvent.click(screen.getByText('✨ Generate Shopping List'))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save List'))
    await waitFor(() => expect(screen.getByText(/Shopping list saved!/)).toBeInTheDocument())
  })
})

describe('ShoppingPage — Pantry tab', () => {
  it('switches to pantry tab', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    expect(screen.getByRole('heading', { name: 'My Pantry' })).toBeInTheDocument()
  })

  it('shows guest notice in pantry tab', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText(/browsing as a guest/)).toBeInTheDocument())
  })

  it('renders pantry categories', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    expect(screen.getByText(/Proteins/)).toBeInTheDocument()
  })

  it('toggles a pantry item', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken Breast'))
    expect(screen.getByText('1 items stocked')).toBeInTheDocument()
  })

  it('shows guest prompt when guest saves pantry', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() => expect(screen.getAllByText(/Sign in/).length).toBeGreaterThan(0))
  })

  it('saves pantry for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<ShoppingPage />)
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() => expect(mockBuilder.upsert).toHaveBeenCalled())
  })
})
