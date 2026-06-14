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
import ShoppingPage from '../../app/shopping/page'

const mockItems = [
  { name: 'Chicken Breast', category: 'Proteins', checked: false },
  { name: 'Broccoli', category: 'Vegetables', checked: false },
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
  global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
    if (opts?.method === 'POST') return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => null })
    if (url === '/api/shopping/list') return Promise.resolve({ ok: true, json: async () => null })
    if (url === '/api/pantry') return Promise.resolve({ ok: true, json: async () => [] })
    return Promise.resolve(makeStreamingMock({ items: [] }))
  }) as any
})

describe('ShoppingPage — Shopping tab', () => {
  it('renders Shopping List tab by default', async () => {
    render(<ShoppingPage />)
    await waitFor(() => expect(screen.getByText('Shopping List')).toBeInTheDocument())
  })

  it('shows guest prompt when guest tries to generate', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('✨ Generate Shopping List'))
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument())
  })

  it('generates list for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: '' }) })
      if (url === '/api/shopping/list') return Promise.resolve({ ok: true, json: async () => null })
      if (url === '/api/pantry') return Promise.resolve({ ok: true, json: async () => [] })
      if (url === '/api/shopping') return Promise.resolve(makeStreamingMock({ items: mockItems }))
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    }) as any
    render(<ShoppingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Shopping List/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /Generate Shopping List/ }))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    expect(screen.getByText('Broccoli')).toBeInTheDocument()
  })

  it('toggles a shopping item as checked', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: '' }) })
      if (url === '/api/shopping/list') return Promise.resolve({ ok: true, json: async () => null })
      if (url === '/api/pantry') return Promise.resolve({ ok: true, json: async () => [] })
      if (url === '/api/shopping') return Promise.resolve(makeStreamingMock({ items: mockItems }))
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    }) as any
    render(<ShoppingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Shopping List/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /Generate Shopping List/ }))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken Breast').closest('div')!)
    expect(screen.getByText('1 items remaining')).toBeInTheDocument()
  })

  it('saves shopping list', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockImplementation((url: string, opts?: any) => {
      if (url === '/api/profile') return Promise.resolve({ ok: true, json: async () => ({ daily_calories: 2000, daily_protein: 150, restrictions: '' }) })
      if (url === '/api/shopping/list') return Promise.resolve({ ok: true, json: async () => null })
      if (url === '/api/pantry') return Promise.resolve({ ok: true, json: async () => [] })
      if (url === '/api/shopping') return Promise.resolve(makeStreamingMock({ items: mockItems }))
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    }) as any
    render(<ShoppingPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Shopping List/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /Generate Shopping List/ }))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save List'))
    await waitFor(() => expect(screen.getByText(/Shopping list saved!/)).toBeInTheDocument())
  })
})

describe('ShoppingPage — Pantry tab', () => {
  it('switches to pantry tab', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    expect(screen.getByRole('heading', { name: 'My Pantry' })).toBeInTheDocument()
  })

  it('shows guest notice in pantry tab', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText(/browsing as a guest/)).toBeInTheDocument())
  })

  it('renders pantry categories', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    expect(screen.getByText(/Proteins/)).toBeInTheDocument()
  })

  it('toggles a pantry item', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken Breast'))
    expect(screen.getByText('1 items stocked')).toBeInTheDocument()
  })

  it('shows guest prompt when guest saves pantry', async () => {
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() => expect(screen.getAllByText(/Sign in/).length).toBeGreaterThan(0))
  })

  it('saves pantry for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<ShoppingPage />)
    fireEvent.click(screen.getByText('🥦 My Pantry'))
    await waitFor(() => expect(screen.getByText('💾 Save')).toBeInTheDocument())
    fireEvent.click(screen.getByText('💾 Save'))
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/pantry', expect.objectContaining({ method: 'POST' }))
    )
  })
})
