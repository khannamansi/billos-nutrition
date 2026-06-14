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
import PantryPage from '../../app/pantry/page'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
})

describe('PantryPage', () => {
  it('renders My Pantry heading', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('My Pantry')).toBeInTheDocument())
  })

  it('shows guest notice when not logged in', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText(/browsing as a guest/)).toBeInTheDocument())
  })

  it('shows Guest label for unauthenticated user', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText(/Guest/)).toBeInTheDocument())
  })

  it('shows Save button for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
  })

  it('renders pantry categories', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText(/Proteins/)).toBeInTheDocument())
  })

  it('loads stocked items for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({
        data: [{ item_name: 'Chicken Breast', is_stocked: true }],
        error: null,
      }).then(resolve)
    )
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('1 items stocked')).toBeInTheDocument())
  })

  it('toggles an item and updates stocked count', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('My Pantry')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken Breast'))
    expect(screen.getByText('1 items stocked')).toBeInTheDocument()
  })

  it('saves pantry for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() => expect(mockBuilder.upsert).toHaveBeenCalled())
  })

  it('filters items by search term', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('My Pantry')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('Search ingredients...'), {
      target: { value: 'chicken' },
    })
    expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
  })
})
