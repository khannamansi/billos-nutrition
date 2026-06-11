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

  it('returns 500 for invalid request', async () => {
    const request = new NextRequest('http://localhost/api/shopping', {
      method: 'POST',
      body: 'invalid json'
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})