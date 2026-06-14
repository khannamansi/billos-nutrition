import { POST } from '../../app/api/shopping/route'
import { NextRequest } from 'next/server'

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        items: [
          { name: 'Chicken Breast', category: 'Proteins', checked: false },
          { name: 'Broccoli', category: 'Vegetables', checked: false },
          { name: 'Greek Yogurt', category: 'Dairy', checked: false }
        ]
      })
    })
  }))
}))

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      formatMessages: jest.fn().mockResolvedValue([])
    })
  }
}))

describe('Shopping API', () => {
  it('returns shopping list items for valid input', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: 'chicken, eggs',
        calories: 1400,
        protein: 120,
        restrictions: 'no beef'
      })
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.items).toBeDefined()
    expect(Array.isArray(data.items)).toBe(true)
  })

  it('returns items with correct shape', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs', calories: 2000, protein: 150, restrictions: '' })
    })
    const response = await POST(request)
    const data = await response.json()
    expect(data.items[0]).toHaveProperty('name')
    expect(data.items[0]).toHaveProperty('category')
    expect(data.items[0]).toHaveProperty('checked')
  })

  it('handles empty ingredients gracefully', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: '', calories: 2000, protein: 150, restrictions: '' })
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('handles missing restrictions gracefully', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 2000, protein: 150 })
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('returns 500 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: 'invalid json'
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('returns 500 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken' })
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('returns error response with error message', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: '{broken'
    })
    const response = await POST(request)
    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(typeof data.error).toBe('string')
  })

  it('returns items with non-empty strings', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken', calories: 2000, protein: 150, restrictions: '' })
    })
    const response = await POST(request)
    const data = await response.json()
    data.items.forEach((item: { name: string; category: string }) => {
      expect(item.name.trim().length).toBeGreaterThan(0)
      expect(item.category.trim().length).toBeGreaterThan(0)
    })
  })

  it('items have checked defaulting to false', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs', calories: 2000, protein: 150, restrictions: '' })
    })
    const response = await POST(request)
    const data = await response.json()
    data.items.forEach((item: { checked: boolean }) => {
      expect(item.checked).toBe(false)
    })
  })
})