import { NextResponse } from 'next/server'
import { searchFoods } from '../../../lib/services/food-search'
import { createSupabaseServer } from '../../../lib/supabase-server'

const USDA_API_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ foods: [] })
  }

  try {
    const supabase = await createSupabaseServer()
    const { data: customFoods, error: customError } = await supabase
      .from('custom_foods')
      .select('id, description, calories_per_100g, protein_per_100g')
    if (customError) console.error('[food-search] custom_foods error:', customError.message)

    const foods = await searchFoods(query, USDA_API_KEY, customFoods ?? [])
    return NextResponse.json({ foods })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
