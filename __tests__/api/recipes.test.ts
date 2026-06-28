/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

jest.mock('../../lib/ratelimit', () => ({
  ratelimit: { limit: jest.fn() },
}))

jest.mock('../../lib/guardrails', () => ({
  validateInput: jest.fn().mockResolvedValue({ valid: true }),
  validateOutput: jest.fn().mockReturnValue({ valid: true }),
}))

jest.mock('../../lib/ai', () => ({
  getModel: jest.fn().mockReturnValue({}),
  collectStream: jest.fn(),
}))

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      formatMessages: jest.fn().mockResolvedValue([]),
    }),
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '../../app/api/recipes/route'
import { createSupabaseServer } from '../../lib/supabase-server'
import { ratelimit } from '../../lib/ratelimit'
import { validateInput, validateOutput } from '../../lib/guardrails'
import { collectStream } from '../../lib/ai'

const mockRecipeJSON = JSON.stringify({
  recipes: [
    {
      name: 'Test Recipe',
      calories: 400,
      protein: 30,
      prepTime: '15 minutes',
      ingredients: 'chicken, broccoli',
      instructions: 'Step 1: Cook. Step 2: Serve.',
    },
  ],
})

const mockUser = { id: 'user1' }
const mockSupabase = { auth: { getUser: jest.fn() } }

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue(mockSupabase)
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  ;(ratelimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 3600000 })
  ;(collectStream as jest.Mock).mockResolvedValue(mockRecipeJSON)
})

describe('Recipe API', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    ;(ratelimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 3600000 })
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(429)
  })

  it('returns recipes for valid input', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken, broccoli', calories: 1400, protein: 120, restrictions: 'no beef' }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.recipes)).toBe(true)
  })

  it('returns recipes with correct shape', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs, milk', calories: 2000, protein: 150, restrictions: '' }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(data.recipes[0]).toHaveProperty('name')
    expect(data.recipes[0]).toHaveProperty('calories')
    expect(data.recipes[0]).toHaveProperty('protein')
    expect(data.recipes[0]).toHaveProperty('prepTime')
    expect(data.recipes[0]).toHaveProperty('ingredients')
    expect(data.recipes[0]).toHaveProperty('instructions')
  })

  it('returns recipes with valid numeric values', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'salmon', calories: 1600, protein: 130, restrictions: 'nut-free' }),
    })
    const response = await POST(request)
    const data = await response.json()
    data.recipes.forEach((recipe: { calories: number; protein: number }) => {
      expect(typeof recipe.calories).toBe('number')
      expect(typeof recipe.protein).toBe('number')
      expect(recipe.calories).toBeGreaterThan(0)
      expect(recipe.protein).toBeGreaterThan(0)
    })
  })

  it('returns recipes with non-empty strings', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'beef, carrots', calories: 1800, protein: 140, restrictions: '' }),
    })
    const response = await POST(request)
    const data = await response.json()
    data.recipes.forEach((r: { name: string; prepTime: string; ingredients: string; instructions: string }) => {
      expect(r.name.trim().length).toBeGreaterThan(0)
      expect(r.prepTime.trim().length).toBeGreaterThan(0)
      expect(r.ingredients.trim().length).toBeGreaterThan(0)
      expect(r.instructions.trim().length).toBeGreaterThan(0)
    })
  })

  it('returns 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 500 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: '{broken',
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('returns error message for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: '{broken',
    })
    const response = await POST(request)
    const data = await response.json()
    expect(typeof data.error).toBe('string')
  })

  it('returns 400 when input is not food-related', async () => {
    ;(validateInput as jest.Mock).mockResolvedValueOnce({ valid: false, reason: 'Input does not appear to be food or nutrition related' })
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'write me a python script', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).error).toMatch(/food|nutrition/i)
  })

  it('returns 422 when generated recipes have unrealistic macros', async () => {
    ;(validateOutput as jest.Mock).mockReturnValueOnce({ valid: false, invalid: [] })
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(422)
  })
})
