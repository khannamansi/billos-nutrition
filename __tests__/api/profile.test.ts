/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET, POST } from '../../app/api/profile/route'

const mockUser = { id: 'user1', email: 'test@test.com' }
const mockProfile = { user_id: 'user1', daily_calories: 2000, daily_protein: 150, restrictions: '' }

const mockSupabase = { auth: { getUser: jest.fn() }, from: jest.fn() }
let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue(mockSupabase)
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }
  mockSupabase.from.mockReturnValue(mockBuilder)
})

describe('Profile API — GET', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns profile for authenticated user', async () => {
    mockBuilder.single.mockResolvedValue({ data: mockProfile, error: null })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockProfile)
  })

  it('returns null when no profile exists (PGRST116)', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('returns 500 on db error', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'db error' } })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('Profile API — POST', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ daily_calories: 2000, daily_protein: 150 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('upserts profile and returns success', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ daily_calories: 2000, daily_protein: 150, restrictions: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('returns 500 on db error', async () => {
    mockBuilder.upsert.mockResolvedValue({ error: { message: 'fail' } })
    const req = new Request('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ daily_calories: 2000, daily_protein: 150 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
