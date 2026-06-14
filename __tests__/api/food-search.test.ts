import { GET } from '../../app/api/food-search/route'

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
    {
      fdcId: 456,
      description: 'Chicken Wing, raw',
      foodNutrients: [
        { nutrientName: 'Energy', value: 203 },
        { nutrientName: 'Protein', value: 18 },
      ],
    },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(mockUSDAResponse),
  }) as any
})

describe('GET /api/food-search', () => {
  it('returns empty array for short queries', async () => {
    const req = new Request('http://localhost/api/food-search?q=a')
    const res = await GET(req)
    const data = await res.json()
    expect(data.foods).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns empty array when no query', async () => {
    const req = new Request('http://localhost/api/food-search')
    const res = await GET(req)
    const data = await res.json()
    expect(data.foods).toEqual([])
  })

  it('calls USDA API and maps response', async () => {
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    const data = await res.json()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('chicken'))
    expect(data.foods).toHaveLength(2)
    expect(data.foods[0]).toMatchObject({
      fdcId: 123,
      description: 'Chicken Breast, cooked',
      calories_per_100g: 165,
      protein_per_100g: 31,
    })
  })

  it('rounds nutrient values', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
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
    const req = new Request('http://localhost/api/food-search?q=oatmeal')
    const res = await GET(req)
    const data = await res.json()
    expect(data.foods[0].calories_per_100g).toBe(68)
    expect(data.foods[0].protein_per_100g).toBe(2)
  })

  it('returns 500 when USDA API fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('returns USDA error status when API returns non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 }) as any
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    expect(res.status).toBe(429)
  })
})
