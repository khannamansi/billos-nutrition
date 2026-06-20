jest.mock('../../lib/supabase-server', () => ({
  createSupabaseServer: jest.fn(),
}))

import { createSupabaseServer } from '../../lib/supabase-server'
import { GET } from '../../app/api/food-search/route'

const mockCustomFoods = [
  { id: 'c1', description: 'Chicken Biryani', calories_per_100g: 150, protein_per_100g: 9 },
  { id: 'c2', description: 'Idli', calories_per_100g: 58, protein_per_100g: 2 },
]

const mockUSDAResponse = {
  foods: [
    {
      fdcId: 123,
      description: 'Chicken Breast, cooked',
      foodNutrients: [
        { nutrientName: 'Energy', value: 165 },
        { nutrientName: 'Protein', value: 31 },
      ],
    },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createSupabaseServer as jest.Mock).mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockCustomFoods, error: null }),
    }),
  })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUSDAResponse),
  }) as any
})

describe('GET /api/food-search', () => {
  it('returns empty array for short queries', async () => {
    const res = await GET(new Request('http://localhost/api/food-search?q=a'))
    const data = await res.json()
    expect(data.foods).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns empty array when no query', async () => {
    const res = await GET(new Request('http://localhost/api/food-search'))
    expect((await res.json()).foods).toEqual([])
  })

  it('returns custom foods (Indian dishes) matching the query', async () => {
    const res = await GET(new Request('http://localhost/api/food-search?q=biryani'))
    const data = await res.json()
    const biryani = data.foods.find((f: any) => f.description === 'Chicken Biryani')
    expect(biryani).toBeDefined()
    expect(biryani.source).toBe('custom')
    expect(biryani.calories_per_100g).toBe(150)
  })

  it('returns custom foods before USDA results', async () => {
    const res = await GET(new Request('http://localhost/api/food-search?q=chicken'))
    const data = await res.json()
    expect(data.foods[0].source).toBe('custom')
  })

  it('returns USDA results when no custom match', async () => {
    ;(createSupabaseServer as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    const res = await GET(new Request('http://localhost/api/food-search?q=chicken'))
    const data = await res.json()
    expect(data.foods[0].source).toBe('usda')
    expect(data.foods[0].description).toBe('Chicken Breast, cooked')
  })

  it('deduplicates when custom and USDA have same description', async () => {
    ;(createSupabaseServer as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'c3', description: 'Chicken Breast, cooked', calories_per_100g: 160, protein_per_100g: 30 }],
          error: null,
        }),
      }),
    })
    const res = await GET(new Request('http://localhost/api/food-search?q=chicken'))
    const data = await res.json()
    const matches = data.foods.filter((f: any) =>
      f.description.toLowerCase() === 'chicken breast, cooked'
    )
    expect(matches).toHaveLength(1)
    expect(matches[0].source).toBe('custom')
  })

  it('rounds nutrient values from USDA', async () => {
    ;(createSupabaseServer as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        foods: [{
          fdcId: 789,
          description: 'Oatmeal',
          foodNutrients: [
            { nutrientName: 'Energy', value: 68.3 },
            { nutrientName: 'Protein', value: 2.4 },
          ],
        }],
      }),
    }) as any
    const res = await GET(new Request('http://localhost/api/food-search?q=oatmeal'))
    const data = await res.json()
    expect(data.foods[0].calories_per_100g).toBe(68)
    expect(data.foods[0].protein_per_100g).toBe(2)
  })

  it('still returns custom foods when USDA fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('USDA down')) as any
    const res = await GET(new Request('http://localhost/api/food-search?q=idli'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.foods.some((f: any) => f.description === 'Idli')).toBe(true)
  })
})
