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
import HistoryPage from '../../app/history/page'

const todayISO = new Date().toISOString()
const sampleMeals = [
  { id: 'm1', meal_name: 'Oatmeal', calories: 300, protein: 10, logged_at: todayISO },
  { id: 'm2', meal_name: 'Chicken Salad', calories: 450, protein: 35, logged_at: todayISO },
]

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
})

describe('HistoryPage', () => {
  it('shows guest prompt for unauthenticated user', async () => {
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument())
  })

  it('shows empty state when user has no meals', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    )
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('No meals logged yet')).toBeInTheDocument())
  })

  it('renders meals list for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleMeals, error: null }).then(resolve)
    )
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Oatmeal')).toBeInTheDocument())
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
  })

  it('shows today calorie and protein totals', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleMeals, error: null }).then(resolve)
    )
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('750')).toBeInTheDocument())
    expect(screen.getByText('45g')).toBeInTheDocument()
  })

  it('adds a new meal', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementation((resolve: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    )
    mockBuilder.single.mockResolvedValue({
      data: { id: 'm3', meal_name: 'Eggs', calories: 200, protein: 15, logged_at: todayISO },
      error: null,
    })
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('No meals logged yet')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Log Meal'))
    fireEvent.change(screen.getByPlaceholderText('Meal name'), { target: { value: 'Eggs' } })
    fireEvent.change(screen.getByPlaceholderText('Calories'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('Protein (g)'), { target: { value: '15' } })
    fireEvent.click(screen.getByText('✅ Log Meal'))
    await waitFor(() => expect(screen.getByText('Eggs')).toBeInTheDocument())
  })

  it('deletes a meal from the list', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: sampleMeals, error: null }).then(resolve)
    )
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Oatmeal')).toBeInTheDocument())
    fireEvent.click(screen.getAllByText('✕')[0])
    await waitFor(() => expect(screen.queryByText('Oatmeal')).not.toBeInTheDocument())
  })

  it('shows guest prompt when guest clicks Log Meal', async () => {
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('+ Log Meal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Log Meal'))
    await waitFor(() => expect(screen.getAllByText(/Sign in/).length).toBeGreaterThan(0))
  })
})
