/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() } },
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

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as any
})

describe('HistoryPage', () => {
  it('shows guest prompt for unauthenticated user', async () => {
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument())
  })

  it('shows empty state when user has no meals', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('No meals logged yet')).toBeInTheDocument())
  })

  it('renders meals list for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(sampleMeals) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Oatmeal')).toBeInTheDocument())
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
  })

  it('shows today calorie and protein totals', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(sampleMeals) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('750')).toBeInTheDocument())
    expect(screen.getByText('45g')).toBeInTheDocument()
  })

  it('adds a new meal', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    const newMeal = { id: 'm3', meal_name: 'Eggs', calories: 200, protein: 15, logged_at: todayISO }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(newMeal) }) as any
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
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(sampleMeals) })
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Oatmeal')).toBeInTheDocument())
    fireEvent.click(screen.getAllByLabelText('Delete meal')[0])
    await waitFor(() => expect(screen.queryByText('Oatmeal')).not.toBeInTheDocument())
  })

  it('shows guest prompt when guest clicks Log Meal', async () => {
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('+ Log Meal')).toBeInTheDocument())
    fireEvent.click(screen.getByText('+ Log Meal'))
    await waitFor(() => expect(screen.getAllByText(/Sign in/).length).toBeGreaterThan(0))
  })
})
