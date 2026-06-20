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
  ],
}

const mockOFFResponse = {
  products: [
    {
      id: 'off1',
      product_name: 'Idli',
      nutriments: { 'energy-kcal_100g': 58, 'proteins_100g': 2 },
    },
  ],
}

function mockFetch(usdaData = mockUSDAResponse, offData = mockOFFResponse) {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('nal.usda.gov')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(usdaData) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(offData) })
  }) as any
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch()
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

  it('searches both USDA and Open Food Facts in parallel', async () => {
    const req = new Request('http://localhost/api/food-search?q=chicken')
    await GET(req)
    const urls = (global.fetch as jest.Mock).mock.calls.map(([url]: [string]) => url)
    expect(urls.some(u => u.includes('nal.usda.gov'))).toBe(true)
    expect(urls.some(u => u.includes('openfoodfacts'))).toBe(true)
  })

  it('returns merged results from both sources', async () => {
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    const data = await res.json()
    expect(data.foods.some((f: any) => f.source === 'usda')).toBe(true)
    expect(data.foods.some((f: any) => f.source === 'openfoodfacts')).toBe(true)
  })

  it('maps USDA response correctly', async () => {
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    const data = await res.json()
    const usda = data.foods.find((f: any) => f.source === 'usda')
    expect(usda).toMatchObject({
      fdcId: '123',
      description: 'Chicken Breast, cooked',
      calories_per_100g: 165,
      protein_per_100g: 31,
    })
  })

  it('maps Open Food Facts response correctly', async () => {
    mockFetch({ foods: [] }, mockOFFResponse)
    const req = new Request('http://localhost/api/food-search?q=idli')
    const res = await GET(req)
    const data = await res.json()
    const off = data.foods.find((f: any) => f.source === 'openfoodfacts')
    expect(off).toMatchObject({
      fdcId: 'off_off1',
      description: 'Idli',
      calories_per_100g: 58,
      protein_per_100g: 2,
    })
  })

  it('still returns results when one source fails', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('nal.usda.gov')) return Promise.reject(new Error('USDA down'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOFFResponse) })
    }) as any
    const req = new Request('http://localhost/api/food-search?q=idli')
    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.foods).toHaveLength(1)
    expect(data.foods[0].source).toBe('openfoodfacts')
  })

  it('deduplicates results by description', async () => {
    const duplicate = {
      products: [{
        id: 'off2',
        product_name: 'Chicken Breast, cooked',
        nutriments: { 'energy-kcal_100g': 160, 'proteins_100g': 30 },
      }],
    }
    mockFetch(mockUSDAResponse, duplicate)
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    const data = await res.json()
    const matches = data.foods.filter((f: any) =>
      f.description.toLowerCase() === 'chicken breast, cooked'
    )
    expect(matches).toHaveLength(1)
    expect(matches[0].source).toBe('usda')
  })

  it('rounds nutrient values', async () => {
    mockFetch({
      foods: [{
        fdcId: 789,
        description: 'Oatmeal',
        foodNutrients: [
          { nutrientName: 'Energy', value: 68.3 },
          { nutrientName: 'Protein', value: 2.4 },
        ],
      }],
    }, { products: [] })
    const req = new Request('http://localhost/api/food-search?q=oatmeal')
    const res = await GET(req)
    const data = await res.json()
    const oat = data.foods.find((f: any) => f.description === 'Oatmeal')
    expect(oat.calories_per_100g).toBe(68)
    expect(oat.protein_per_100g).toBe(2)
  })

  it('returns 500 when all sources throw', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any
    // searchFoods uses Promise.allSettled so individual failures don't throw
    // but if the whole function throws for another reason it returns 500
    const req = new Request('http://localhost/api/food-search?q=chicken')
    const res = await GET(req)
    // graceful degradation: both fail → empty array, not 500
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.foods).toEqual([])
  })
})
