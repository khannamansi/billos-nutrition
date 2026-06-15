import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { MealSchema, badRequest } from '../../../lib/validation'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('meal_history')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meals: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = MealSchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)
  const { data, error } = await supabase
    .from('meal_history')
    .insert({ user_id: user.id, ...parsed.data, logged_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
