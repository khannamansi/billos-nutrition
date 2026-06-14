/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import ResetPassword from '../../app/auth/reset-password/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('ResetPassword', () => {
  it('renders password inputs', () => {
    render(<ResetPassword />)
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
  })

  it('shows mismatch error when passwords differ', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'abc123' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'xyz789' } })
    fireEvent.click(screen.getByText('Update Password'))
    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument())
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByText('Update Password'))
    await waitFor(() =>
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    )
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('calls updateUser with new password', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByText('Update Password'))
    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpass123' })
    )
  })

  it('redirects to dashboard on success', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByText('Update Password'))
    await waitFor(() => expect((window as any).location.href).toBe('/dashboard'))
  })

  it('shows API error on failure', async () => {
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: { message: 'Session expired' } })
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByText('Update Password'))
    await waitFor(() => expect(screen.getByText('Session expired')).toBeInTheDocument())
  })
})
