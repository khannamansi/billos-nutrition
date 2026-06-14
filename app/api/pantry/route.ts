import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { PANTRY_CATEGORIES } from '../../../lib/pantryData'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('pantry_items')
    .select('item_name, is_stocked')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stocked } = await request.json()
  const upserts = Object.entries(stocked as Record<string, boolean>).map(([item_name, is_stocked]) => ({
    user_id: user!.id,
    item_name,
    category: PANTRY_CATEGORIES.find((c) => c.items.includes(item_name))?.name ?? 'Other',
    is_stocked,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('pantry_items')
    .upsert(upserts, { onConflict: 'user_id,item_name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
