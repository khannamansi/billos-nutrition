import { NextResponse } from 'next/server'
import { searchFoods } from '../../../lib/services/food-search'

const USDA_API_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ foods: [] })
  }

  try {
    const foods = await searchFoods(query, USDA_API_KEY)
    return NextResponse.json({ foods })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
