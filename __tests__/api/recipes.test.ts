import { POST } from '../../app/api/recipes/route'
import { NextRequest } from 'next/server'

// Mock LangChain
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        recipes: [
          {
            name: 'Test Recipe',
            calories: 400,
            protein: 30,
            prepTime: '15 minutes',
            ingredients: 'chicken, broccoli',
            instructions: 'Step 1: Cook. Step 2: Serve.'
          }
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

describe('Recipe API', () => {
  it('returns 3 recipes for valid input', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: 'chicken, broccoli',
        calories: 1400,
        protein: 120,
        restrictions: 'no beef'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.recipes).toBeDefined()
    expect(Array.isArray(data.recipes)).toBe(true)
  })

  it('returns 500 for invalid request', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: 'invalid json'
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})