/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET, POST } from '../../app/api/pantry/route'

const mockUser = { id: 'user1' }

const mockSupabase = { auth: { getUser: jest.fn() }, from: jest.fn() }
let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue(mockSupabase)
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    then: jest.fn().mockImplementation((cb: any) =>
      Promise.resolve({ data: [], error: null }).then(cb)
    ),
  }
  mockSupabase.from.mockReturnValue(mockBuilder)
})

describe('Pantry API — GET', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns pantry items for user', async () => {
    const items = [
      { item_name: 'Chicken Breast', is_stocked: true },
      { item_name: 'Broccoli', is_stocked: false },
    ]
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ data: items, error: null }).then(cb)
    )
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(items)
  })

  it('returns empty array when no items exist', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 on db error', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ data: null, error: { message: 'fail' } }).then(cb)
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('Pantry API — POST', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/pantry', {
      method: 'POST',
      body: JSON.stringify({ stocked: { 'Chicken Breast': true } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('upserts pantry items and returns success', async () => {
    const req = new Request('http://localhost/api/pantry', {
      method: 'POST',
      body: JSON.stringify({ stocked: { 'Chicken Breast': true, 'Broccoli': false } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('calls upsert with onConflict user_id,item_name', async () => {
    const req = new Request('http://localhost/api/pantry', {
      method: 'POST',
      body: JSON.stringify({ stocked: { 'Eggs': true } }),
    })
    await POST(req)
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ item_name: 'Eggs', is_stocked: true })]),
      { onConflict: 'user_id,item_name' }
    )
  })

  it('returns 500 on db error', async () => {
    mockBuilder.upsert.mockResolvedValue({ error: { message: 'fail' } })
    const req = new Request('http://localhost/api/pantry', {
      method: 'POST',
      body: JSON.stringify({ stocked: { 'Eggs': true } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
