import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { MealSchema, badRequest } from '../../../lib/validation'
import { getMeals, createMeal } from '../../../lib/services/meals'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))

  try {
    const result = await getMeals(supabase, user.id, { from, to, page, limit })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = MealSchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)

  try {
    const meal = await createMeal(supabase, user.id, parsed.data)
    return NextResponse.json(meal)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
