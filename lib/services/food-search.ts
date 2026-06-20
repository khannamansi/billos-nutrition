export interface FoodResult {
  fdcId: string
  description: string
  calories_per_100g: number
  protein_per_100g: number
  source: 'usda' | 'openfoodfacts'
}

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'
const OFF_BASE = 'https://world.openfoodfacts.org/cgi/search.pl'

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

async function searchOpenFoodFacts(query: string): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '8',
    fields: 'id,product_name,nutriments',
  })
  const res = await fetch(`${OFF_BASE}?${params}`)
  if (!res.ok) return []

  const data = await res.json()
  return (data.products ?? [])
    .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
    .map((p: any) => ({
      fdcId: `off_${p.id ?? p._id}`,
      description: p.product_name,
      calories_per_100g: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
      protein_per_100g: Math.round(p.nutriments['proteins_100g'] ?? 0),
      source: 'openfoodfacts' as const,
    }))
}

export async function searchFoods(query: string, usdaApiKey: string): Promise<FoodResult[]> {
  const [usdaResults, offResults] = await Promise.allSettled([
    searchUSDA(query, usdaApiKey),
    searchOpenFoodFacts(query),
  ])

  const usda = usdaResults.status === 'fulfilled' ? usdaResults.value : []
  const off = offResults.status === 'fulfilled' ? offResults.value : []

  // Deduplicate by normalised description — prefer USDA entries
  const seen = new Set(usda.map(f => f.description.toLowerCase()))
  const uniqueOff = off.filter(f => !seen.has(f.description.toLowerCase()))

  return [...usda, ...uniqueOff].slice(0, 12)
}
