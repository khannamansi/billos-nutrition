/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET, POST } from '../../app/api/shopping/list/route'

const mockUser = { id: 'user1' }
const mockList = {
  id: 'sl1',
  user_id: 'user1',
  items: [{ name: 'Chicken Breast', category: 'Proteins', checked: false }],
  created_at: new Date().toISOString(),
}

const mockSupabase = { auth: { getUser: jest.fn() }, from: jest.fn() }
let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue(mockSupabase)
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((cb: any) =>
      Promise.resolve({ data: null, error: null }).then(cb)
    ),
  }
  mockSupabase.from.mockReturnValue(mockBuilder)
})

describe('Shopping List API — GET', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the latest shopping list', async () => {
    mockBuilder.single.mockResolvedValue({ data: mockList, error: null })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockList)
  })

  it('returns null when no list exists (PGRST116)', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('returns 500 on non-PGRST116 db error', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'db error' } })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('Shopping List API — POST', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/shopping/list', {
      method: 'POST',
      body: JSON.stringify({ items: [{ name: 'Eggs', category: 'Proteins', checked: false }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('saves a shopping list and returns success', async () => {
    const req = new Request('http://localhost/api/shopping/list', {
      method: 'POST',
      body: JSON.stringify({ items: [{ name: 'Eggs', category: 'Proteins', checked: false }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('inserts with user_id and items', async () => {
    const items = [{ name: 'Eggs', category: 'Proteins', checked: false }]
    const req = new Request('http://localhost/api/shopping/list', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
    await POST(req)
    expect(mockBuilder.insert).toHaveBeenCalledWith({ user_id: mockUser.id, items })
  })

  it('returns 500 on db error', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ error: { message: 'fail' } }).then(cb)
    )
    const req = new Request('http://localhost/api/shopping/list', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
