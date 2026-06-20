import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { ShoppingListSchema, badRequest } from '../../../../lib/validation'
import { getShoppingList, saveShoppingList } from '../../../../lib/services/shopping'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const list = await getShoppingList(supabase, user.id)
    return NextResponse.json(list)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = ShoppingListSchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)

  try {
    await saveShoppingList(supabase, user.id, JSON.stringify(parsed.data.items))
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
