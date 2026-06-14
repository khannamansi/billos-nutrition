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
import HistoryPage from '../../app/history/page'

const todayISO = new Date().toISOString()
const sampleMeals = [
  { id: 'm1', meal_name: 'Oatmeal', calories: 300, protein: 10, logged_at: todayISO },
  { id: 'm2', meal_name: 'Chicken Salad', calories: 450, protein: 35, logged_at: todayISO },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ meals: [], total: 0 }) }) as any
})

describe('HistoryPage', () => {
  it('shows guest prompt for unauthenticated user', async () => {
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText(/Sign in/)).toBeInTheDocument())
  })

  it('shows empty state when user has no meals', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('No meals logged yet')).toBeInTheDocument())
  })

  it('renders meals list for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ meals: sampleMeals, total: 2 }) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Oatmeal')).toBeInTheDocument())
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
  })

  it('shows today calorie and protein totals', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ meals: sampleMeals, total: 2 }) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('750')).toBeInTheDocument())
    expect(screen.getByText('45g')).toBeInTheDocument()
  })

  it('adds a new meal', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    const newMeal = { id: 'm3', meal_name: 'Eggs', calories: 200, protein: 15, logged_at: todayISO }
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ meals: [], total: 0 }) })
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
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ meals: sampleMeals, total: 2 }) })
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

  it('shows Load more when there are more meals', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ meals: sampleMeals, total: 50 }) }) as any
    render(<HistoryPage />)
    await waitFor(() => expect(screen.getByText('Load more')).toBeInTheDocument())
  })
})
