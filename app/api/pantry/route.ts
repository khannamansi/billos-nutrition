import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { PANTRY_CATEGORIES } from '../../../lib/pantryData'
import { PantrySchema, badRequest } from '../../../lib/validation'
import { getPantryItems, upsertPantryItems } from '../../../lib/services/pantry'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function getCategoryForItem(itemName: string): string {
  return PANTRY_CATEGORIES.find((c) => c.items.includes(itemName))?.name ?? 'Other'
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const items = await getPantryItems(supabase, user.id)
    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = PantrySchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)

  try {
    await upsertPantryItems(supabase, user.id, parsed.data.stocked as Record<string, boolean>, getCategoryForItem)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
