import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../../lib/supabase-server'
import { deleteSavedRecipe } from '../../../../../lib/services/recipes'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteSavedRecipe(supabase, user.id, id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
