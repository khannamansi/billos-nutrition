/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import ForgotPassword from '../../app/auth/forgot-password/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null })
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('ForgotPassword', () => {
  it('renders email input', () => {
    render(<ForgotPassword />)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
  })

  it('renders Send Reset Link button', () => {
    render(<ForgotPassword />)
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument()
  })

  it('does not call API when email is empty', async () => {
    render(<ForgotPassword />)
    fireEvent.click(screen.getByText('Send Reset Link'))
    await waitFor(() => expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled())
  })

  it('calls resetPasswordForEmail with the entered email', async () => {
    render(<ForgotPassword />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Reset Link'))
    await waitFor(() =>
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object)
      )
    )
  })

  it('shows sent confirmation on success', async () => {
    render(<ForgotPassword />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByText('Send Reset Link'))
    await waitFor(() => expect(screen.getByText('Reset link sent!')).toBeInTheDocument())
  })

  it('shows error on failure', async () => {
    ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: { message: 'User not found' },
    })
    render(<ForgotPassword />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'no@example.com' } })
    fireEvent.click(screen.getByText('Send Reset Link'))
    await waitFor(() => expect(screen.getByText('User not found')).toBeInTheDocument())
  })

  it('renders Back to Login link', () => {
    render(<ForgotPassword />)
    expect(screen.getByText('← Back to Login')).toBeInTheDocument()
  })
})
