import { NextResponse } from 'next/server'

const USDA_API_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY'
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ foods: [] })
  }

  try {
    const res = await fetch(
      `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=6&dataType=SR%20Legacy,Survey%20(FNDDS)&api_key=${USDA_API_KEY}`
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'USDA API error' }, { status: res.status })
    }

    const data = await res.json()

    const foods = (data.foods ?? []).map((food: any) => {
      const nutrients: Record<string, number> = {}
      for (const n of food.foodNutrients ?? []) {
        if (n.nutrientName === 'Energy') nutrients.calories = Math.round(n.value ?? 0)
        if (n.nutrientName === 'Protein') nutrients.protein = Math.round(n.value ?? 0)
      }
      return {
        fdcId: food.fdcId,
        description: food.description,
        calories_per_100g: nutrients.calories ?? 0,
        protein_per_100g: nutrients.protein ?? 0,
      }
    })

    return NextResponse.json({ foods })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
