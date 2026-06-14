/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ user: null, loading: false }),
}))

import { useUser } from '../../lib/UserContext'
import Onboarding from '../../app/onboarding/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(useUser as jest.Mock).mockReturnValue({ user: null, loading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(null) }) as any
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('Onboarding', () => {
  it('redirects to login when no user', async () => {
    render(<Onboarding />)
    await waitFor(() => expect((window as any).location.href).toBe('/auth/login'))
  })

  it('renders sliders for logged-in user', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Daily Calories/)).toBeInTheDocument())
    expect(screen.getByText(/Daily Protein/)).toBeInTheDocument()
  })

  it('loads existing profile into sliders', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ daily_calories: 1800, daily_protein: 130, restrictions: 'gluten free' }),
    }) as any
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText('1800 kcal')).toBeInTheDocument())
    expect(screen.getByDisplayValue('gluten free')).toBeInTheDocument()
  })

  it('saves goals on button click', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) }) as any
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' })))
  })

  it('shows success message after save', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) }) as any
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(screen.getByText('Goals saved!')).toBeInTheDocument())
  })

  it('shows error when save fails', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(null) })
      .mockResolvedValueOnce({ ok: false, json: jest.fn().mockResolvedValue({ error: 'DB error' }) }) as any
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(screen.getByText(/Error saving/)).toBeInTheDocument())
  })

  it('renders back to dashboard link', async () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: { id: 'u1' }, loading: false })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument())
  })
})
