import { NextRequest } from 'next/server'
import { POST } from '../../app/api/recipes/route'

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

jest.mock('../../lib/langchain', () => ({
  createModel: jest.fn().mockReturnValue({
    stream: jest.fn().mockImplementation(() =>
      Promise.resolve(
        (async function* () {
          yield { content: mockRecipeJSON }
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

describe('Recipe API', () => {
  it('returns recipes for valid input', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'chicken, broccoli', calories: 1400, protein: 120, restrictions: 'no beef' }),
    })
    const response = await POST(request)
    const text = await readStreamText(response)
    const data = JSON.parse(text)
    expect(response.status).toBe(200)
    expect(Array.isArray(data.recipes)).toBe(true)
  })

  it('returns recipes with correct shape', async () => {
    const request = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ ingredients: 'eggs, milk', calories: 2000, protein: 150, restrictions: '' }),
    })
    const response = await POST(request)
    const data = JSON.parse(await readStreamText(response))
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
    const data = JSON.parse(await readStreamText(response))
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
    const data = JSON.parse(await readStreamText(response))
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
})
