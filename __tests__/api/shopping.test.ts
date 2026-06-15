/** @jest-environment node */

jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

jest.mock('../../lib/ratelimit', () => ({
  ratelimit: { limit: jest.fn() },
}))

jest.mock('../../lib/langchain', () => ({
  createModel: jest.fn().mockReturnValue({
    stream: jest.fn().mockImplementation(() =>
      Promise.resolve(
        (async function* () {
          yield { content: mockShoppingJSON }
        })()
      )
    ),
  }),
}))

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      formatMessages: jest.fn().mockResolvedValue([]),
    }),
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '../../app/api/shopping/route'
import { createSupabaseServer } from '../../lib/supabase-server'
import { ratelimit } from '../../lib/ratelimit'

const mockShoppingJSON = JSON.stringify({
  items: [
    { name: 'Chicken Breast', category: 'Proteins', checked: false },
    { name: 'Broccoli', category: 'Vegetables', checked: false },
    { name: 'Greek Yogurt', category: 'Dairy', checked: false },
  ],
})

const mockUser = { id: 'user1' }
const mockSupabase = { auth: { getUser: jest.fn() } }

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue(mockSupabase)
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  ;(ratelimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 3600000 })
})

async function readStreamText(response: Response): Promise<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value)
  }
  return text
}

describe('Shopping API', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    ;(ratelimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 3600000 })
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 1400, protein: 120 }),
    })
    const response = await POST(request)
    expect(response.status).toBe(429)
  })

  it('returns shopping list items for valid input', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken, eggs', calories: 1400, protein: 120, restrictions: 'no beef' }),
    })
    const response = await POST(request)
    const data = JSON.parse(await readStreamText(response))
    expect(response.status).toBe(200)
    expect(Array.isArray(data.items)).toBe(true)
  })

  it('returns items with correct shape', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs', calories: 2000, protein: 150, restrictions: '' }),
    })
    const response = await POST(request)
    const data = JSON.parse(await readStreamText(response))
    expect(data.items[0]).toHaveProperty('name')
    expect(data.items[0]).toHaveProperty('category')
    expect(data.items[0]).toHaveProperty('checked')
  })

  it('returns items with non-empty strings', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 2000, protein: 150, restrictions: '' }),
    })
    const response = await POST(request)
    const data = JSON.parse(await readStreamText(response))
    data.items.forEach((item: { name: string; category: string }) => {
      expect(item.name.trim().length).toBeGreaterThan(0)
      expect(item.category.trim().length).toBeGreaterThan(0)
    })
  })

  it('items have checked defaulting to false', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs', calories: 2000, protein: 150, restrictions: '' }),
    })
    const response = await POST(request)
    const data = JSON.parse(await readStreamText(response))
    data.items.forEach((item: { checked: boolean }) => {
      expect(item.checked).toBe(false)
    })
  })

  it('returns 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 500 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: '{broken',
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('returns error message for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: '{broken',
    })
    const response = await POST(request)
    const data = await response.json()
    expect(typeof data.error).toBe('string')
  })
})
