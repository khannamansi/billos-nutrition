/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET, POST } from '../../app/api/recipes/saved/route'
import { DELETE } from '../../app/api/recipes/saved/[id]/route'

const mockUser = { id: 'user1' }
const mockRecipe = {
  id: 'r1',
  user_id: 'user1',
  title: 'Grilled Chicken',
  calories: 400,
  protein: 45,
  saved_at: new Date().toISOString(),
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
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((cb: any) =>
      Promise.resolve({ data: [], error: null }).then(cb)
    ),
  }
  mockSupabase.from.mockReturnValue(mockBuilder)
})

describe('Saved Recipes API — GET', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns saved recipes for user', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ data: [mockRecipe], error: null }).then(cb)
    )
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([mockRecipe])
  })

  it('returns empty array when no recipes saved', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 on db error', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(cb)
    )
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('Saved Recipes API — POST', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/recipes/saved', {
      method: 'POST',
      body: JSON.stringify({ title: 'Grilled Chicken', calories: 400, protein: 45 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('saves a recipe and returns it', async () => {
    mockBuilder.single.mockResolvedValue({ data: mockRecipe, error: null })
    const req = new Request('http://localhost/api/recipes/saved', {
      method: 'POST',
      body: JSON.stringify({ name: 'Grilled Chicken', calories: 400, protein: 45, ingredients: 'Chicken', instructions: 'Grill it' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(mockRecipe)
  })

  it('returns 500 on db error', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { message: 'fail' } })
    const req = new Request('http://localhost/api/recipes/saved', {
      method: 'POST',
      body: JSON.stringify({ name: 'Grilled Chicken', calories: 400, protein: 45, ingredients: 'Chicken', instructions: 'Grill it' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('Saved Recipes API — DELETE /[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await DELETE(new Request('http://localhost/api/recipes/saved/r1'), {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(401)
  })

  it('deletes a recipe and returns success', async () => {
    const res = await DELETE(new Request('http://localhost/api/recipes/saved/r1'), {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('filters by both id and user_id for security', async () => {
    await DELETE(new Request('http://localhost/api/recipes/saved/r1'), {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'r1')
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id)
  })

  it('returns 500 on db error', async () => {
    mockBuilder.then.mockImplementation((cb: any) =>
      Promise.resolve({ error: { message: 'fail' } }).then(cb)
    )
    const res = await DELETE(new Request('http://localhost/api/recipes/saved/r1'), {
      params: Promise.resolve({ id: 'r1' }),
    })
    expect(res.status).toBe(500)
  })
})
