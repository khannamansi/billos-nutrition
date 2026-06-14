/** @jest-environment node */

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
  createServerClient: jest.fn().mockReturnValue({ auth: { getUser: jest.fn() }, from: jest.fn() }),
}))

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createSupabaseServer } from '../../lib/supabase-server'

const mockCookieStore = {
  getAll: jest.fn().mockReturnValue([]),
  set: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
})

describe('createSupabaseServer', () => {
  it('awaits cookies() to get the cookie store', async () => {
    await createSupabaseServer()
    expect(cookies).toHaveBeenCalled()
  })

  it('calls createServerClient with supabase env vars', async () => {
    await createSupabaseServer()
    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expect.objectContaining({ cookies: expect.any(Object) })
    )
  })

  it('returns the supabase client', async () => {
    const client = await createSupabaseServer()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })

  it('passes getAll from cookie store to createServerClient', async () => {
    mockCookieStore.getAll.mockReturnValue([{ name: 'sb-token', value: 'abc' }])
    await createSupabaseServer()
    const cookiesArg = (createServerClient as jest.Mock).mock.calls[0][2].cookies
    expect(cookiesArg.getAll()).toEqual([{ name: 'sb-token', value: 'abc' }])
  })
})
