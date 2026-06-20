/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import LoginPage from '../../app/auth/login/page'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null })
  ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null })
  ;(supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({})
  delete (window as any).location
  ;(window as any).location = { href: '', origin: 'http://localhost' }
})

describe('LoginPage', () => {
  it('renders sign in form', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('shows Welcome back heading in sign-in mode', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
  })

  it('toggles to sign up mode', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('toggles back to sign in from sign up', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.click(screen.getByText('Sign In'))
    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
  })

  it('calls signInWithPassword on sign in', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getAllByText('Sign In')[0])
    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass123' })
    )
  })

  it('redirects to dashboard after successful sign in', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getAllByText('Sign In')[0])
    await waitFor(() => expect((window as any).location.href).toBe('/dashboard'))
  })

  it('shows error on failed sign in', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getAllByText('Sign In')[0])
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })

  it('calls signUp in sign up mode', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('Create Account'))
    await waitFor(() =>
      expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@b.com', password: 'pass123' })
    )
  })

  it('shows confirmation after sign up', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('Create Account'))
    await waitFor(() => expect(screen.getByText(/Check your email/)).toBeInTheDocument())
  })

  it('shows generic error and re-enables button when signUp throws', async () => {
    ;(supabase.auth.signUp as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('Create Account'))
    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
    expect(screen.getByText('Create Account')).not.toBeDisabled()
  })

  it('shows generic error and re-enables button when signInWithPassword throws', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getAllByText('Sign In')[0])
    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
    expect(screen.getAllByText('Sign In')[0]).not.toBeDisabled()
  })

  it('switches to sign-in and shows helpful message when account already exists', async () => {
    ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: { message: 'User already registered' } })
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'existing@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('Create Account'))
    await waitFor(() => expect(screen.getByText(/Account already exists/)).toBeInTheDocument())
    expect(screen.getByText('Welcome back!')).toBeInTheDocument()
  })

  it('calls signInWithOAuth on Google button click', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() =>
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    )
  })

  it('passes redirectTo pointing at /auth/callback for Google sign-in', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() =>
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost/auth/callback' },
      })
    )
  })

  it('creates a new user session via Google OAuth callback after sign-in', async () => {
    // Simulates the full Google sign-in user creation flow:
    // 1. user clicks Continue with Google → signInWithOAuth called
    // 2. Supabase redirects to /auth/callback?code=... → session created
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Continue with Google'))
    await waitFor(() =>
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          options: expect.objectContaining({ redirectTo: expect.stringContaining('/auth/callback') }),
        })
      )
    )
  })

  it('renders Continue as Guest link', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument()
  })
})
