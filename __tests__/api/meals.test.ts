/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET, POST } from '../../app/api/meals/route'
import { DELETE } from '../../app/api/meals/[id]/route'

const mockUser = { id: 'user1' }
const mockMeals = [
  { id: 'm1', meal_name: 'Oatmeal', calories: 300, protein: 10, logged_at: new Date().toISOString() },
  { id: 'm2', meal_name: 'Chicken', calories: 450, protein: 40, logged_at: new Date().toISOString() },
]

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
    range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((cb: any) =>
      Promise.resolve({ data: null, error: null }).then(cb)
    ),
  }
  mockSupabase.from.mockReturnValue(mockBuilder)
})

describe('Meals API — GET', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(new Request('http://localhost/api/meals'))
    expect(res.status).toBe(401)
  })

  it('returns paginated meals with total', async () => {
    mockBuilder.range.mockResolvedValue({ data: mockMeals, error: null, count: 2 })
    const res = await GET(new Request('http://localhost/api/meals'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.meals).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.page).toBe(1)
  })

  it('respects page and limit query params', async () => {
    mockBuilder.range.mockResolvedValue({ data: [], error: null, count: 50 })
    const res = await GET(new Request('http://localhost/api/meals?page=2&limit=10'))
    const body = await res.json()
    expect(body.page).toBe(2)
    expect(body.limit).toBe(10)
    expect(mockBuilder.range).toHaveBeenCalledWith(10, 19)
  })

  it('returns 500 on db error', async () => {
    mockBuilder.range.mockResolvedValue({ data: null, error: { message: 'db error' }, count: null })
    const res = await GET(new Request('http://localhost/api/meals'))
    expect(res.status).toBe(500)
  })
})

describe('Meals API — POST', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ meal_name: 'Eggs', calories: 200, protein: 15 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('logs a new meal and returns it', async () => {
    const newMeal = { id: 'm3', meal_name: 'Eggs', calories: 200, protein: 15 }
    mockBuilder.single.mockResolvedValue({ data: newMeal, error: null })
    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ meal_name: 'Eggs', calories: 200, protein: 15 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(newMeal)
  })

  it('returns 500 on db error', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { message: 'fail' } })
    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ meal_name: 'Eggs', calories: 200, protein: 15 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('Meals API — DELETE /[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await DELETE(new Request('http://localhost/api/meals/m1'), {
      params: Promise.resolve({ id: 'm1' }),
    })
    expect(res.status).toBe(401)
  })

  it('deletes a meal and returns success', async () => {
    const res = await DELETE(new Request('http://localhost/api/meals/m1'), {
      params: Promise.resolve({ id: 'm1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('filters by both id and user_id for security', async () => {
    await DELETE(new Request('http://localhost/api/meals/m1'), {
      params: Promise.resolve({ id: 'm1' }),
    })
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'm1')
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
  })

  it('returns 500 on db error', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ error: { message: 'fail' } }).then(cb)
    )
    const res = await DELETE(new Request('http://localhost/api/meals/m1'), {
      params: Promise.resolve({ id: 'm1' }),
    })
    expect(res.status).toBe(500)
  })
})
