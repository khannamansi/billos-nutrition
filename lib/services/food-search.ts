import Fuse from 'fuse.js'

export interface FoodResult {
  fdcId: string
  description: string
  calories_per_100g: number
  protein_per_100g: number
  source: 'usda' | 'custom'
}

export interface CustomFood {
  id: string
  description: string
  calories_per_100g: number
  protein_per_100g: number
}

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

async function searchUSDA(query: string, apiKey: string): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    query,
    pageSize: '8',
    dataType: 'Foundation,SR Legacy',
    api_key: apiKey,
  })
  const res = await fetch(`${USDA_BASE}/foods/search?${params}`)
  if (!res.ok) return []

  const data = await res.json()
  return (data.foods ?? []).map((food: any) => {
    const nutrients: Record<string, number> = {}
    for (const n of food.foodNutrients ?? []) {
      if (n.nutrientName === 'Energy') nutrients.calories = Math.round(n.value ?? 0)
      if (n.nutrientName === 'Protein') nutrients.protein = Math.round(n.value ?? 0)
    }
    return {
      fdcId: String(food.fdcId),
      description: food.description,
      calories_per_100g: nutrients.calories ?? 0,
      protein_per_100g: nutrients.protein ?? 0,
      source: 'usda' as const,
    }
  })
}

function matchCustomFoods(query: string, customFoods: CustomFood[]): FoodResult[] {
  const fuse = new Fuse(customFoods, {
    keys: ['description'],
    threshold: 0.4,
  })
  return fuse.search(query).map(({ item }) => ({
    fdcId: `custom_${item.id}`,
    description: item.description,
    calories_per_100g: item.calories_per_100g,
    protein_per_100g: item.protein_per_100g,
    source: 'custom' as const,
  }))
}

export async function searchFoods(
  query: string,
  usdaApiKey: string,
  customFoods: CustomFood[] = [],
): Promise<FoodResult[]> {
  const [usdaResults] = await Promise.allSettled([searchUSDA(query, usdaApiKey)])

  const usda = usdaResults.status === 'fulfilled' ? usdaResults.value : []
  const custom = matchCustomFoods(query, customFoods)

  // Custom foods first (Indian dishes), then USDA — deduplicate by description
  const seen = new Set(custom.map(f => f.description.toLowerCase()))
  const uniqueUsda = usda.filter(f => !seen.has(f.description.toLowerCase()))

  return [...custom, ...uniqueUsda].slice(0, 12)
}
