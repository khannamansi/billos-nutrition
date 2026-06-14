/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

import { supabase } from '../../lib/supabase'
import Onboarding from '../../app/onboarding/page'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('Onboarding', () => {
  it('redirects to login when no user', async () => {
    render(<Onboarding />)
    await waitFor(() => expect((window as any).location.href).toBe('/auth/login'))
  })

  it('renders sliders for logged-in user', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Daily Calories/)).toBeInTheDocument())
    expect(screen.getByText(/Daily Protein/)).toBeInTheDocument()
  })

  it('loads existing profile into sliders', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.single.mockResolvedValue({
      data: { daily_calories: 1800, daily_protein: 130, restrictions: 'gluten free' },
      error: null,
    })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText('1800 kcal')).toBeInTheDocument())
    expect(screen.getByDisplayValue('gluten free')).toBeInTheDocument()
  })

  it('saves goals on button click', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(mockBuilder.upsert).toHaveBeenCalled())
  })

  it('shows success message after save', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(screen.getByText('Goals saved!')).toBeInTheDocument())
  })

  it('shows error when save fails', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockBuilder.upsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText(/Set Your Diet Goals/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Save My Goals/))
    await waitFor(() => expect(screen.getByText(/Error saving/)).toBeInTheDocument())
  })

  it('renders back to dashboard link', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<Onboarding />)
    await waitFor(() => expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument())
  })
})
