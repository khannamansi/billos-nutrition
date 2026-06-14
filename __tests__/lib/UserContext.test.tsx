/** @jest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import { UserProvider, useUser } from '../../lib/UserContext'

function TestConsumer() {
  const { user, loading } = useUser()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? (user as any).id : 'null'}</span>
    </div>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
  ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
})

describe('UserContext', () => {
  it('starts with loading=true', () => {
    ;(supabase.auth.getUser as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<UserProvider><TestConsumer /></UserProvider>)
    expect(screen.getByTestId('loading').textContent).toBe('true')
  })

  it('sets loading=false after auth resolves', async () => {
    render(<UserProvider><TestConsumer /></UserProvider>)
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
  })

  it('provides user when authenticated', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    render(<UserProvider><TestConsumer /></UserProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u1'))
  })

  it('provides null user for unauthenticated', async () => {
    render(<UserProvider><TestConsumer /></UserProvider>)
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('updates user on auth state change', async () => {
    let changeCallback: any
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb: any) => {
      changeCallback = cb
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    render(<UserProvider><TestConsumer /></UserProvider>)
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    changeCallback('SIGNED_IN', { user: { id: 'u2' } })
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u2'))
  })

  it('clears user on sign out via auth state change', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1' } } })
    let changeCallback: any
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb: any) => {
      changeCallback = cb
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    render(<UserProvider><TestConsumer /></UserProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u1'))
    changeCallback('SIGNED_OUT', null)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))
  })
})
