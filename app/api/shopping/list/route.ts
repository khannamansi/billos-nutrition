import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { ShoppingListSchema, badRequest } from '../../../../lib/validation'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ShoppingListSchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)
  const { error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: user.id, items: parsed.data.items })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
