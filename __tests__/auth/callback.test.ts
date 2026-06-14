jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  }),
}))

import { createServerClient } from '@supabase/ssr'
import { GET } from '../../app/auth/callback/route'

let mockExchangeCode: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockExchangeCode = jest.fn().mockResolvedValue({ data: {}, error: null })
  ;(createServerClient as jest.Mock).mockReturnValue({
    auth: { exchangeCodeForSession: mockExchangeCode },
  })
})

describe('auth callback', () => {
  it('exchanges the code and redirects to dashboard', async () => {
    const request = new Request('http://localhost/auth/callback?code=abc-123')
    const response = await GET(request)
    expect(mockExchangeCode).toHaveBeenCalledWith('abc-123')
    expect(response.url).toContain('/dashboard')
  })

  it('redirects to dashboard without a code', async () => {
    const request = new Request('http://localhost/auth/callback')
    const response = await GET(request)
    expect(mockExchangeCode).not.toHaveBeenCalled()
    expect(response.url).toContain('/dashboard')
  })
})
