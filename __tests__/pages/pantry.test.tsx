/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

jest.mock('../../components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar" />,
}))

jest.mock('../../components/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}))

import { useUser } from '../../lib/UserContext'
import PantryPage from '../../app/pantry/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as any
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
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
  })

  it('renders pantry categories', async () => {
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText(/Proteins/)).toBeInTheDocument())
  })

  it('loads stocked items for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([{ item_name: 'Chicken Breast', is_stocked: true }]),
    }) as any
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
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === 'POST') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
      return Promise.resolve({ ok: true, json: async () => [] })
    }) as any
    render(<PantryPage />)
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/pantry', expect.objectContaining({ method: 'POST' })))
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
