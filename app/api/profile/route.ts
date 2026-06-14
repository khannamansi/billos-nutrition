import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('diet_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116')
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabase
    .from('diet_profiles')
    .upsert(
      { user_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
