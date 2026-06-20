import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../../../../lib/supabase-server'
import { SavedRecipeSchema, badRequest } from '../../../../lib/validation'
import { getSavedRecipes, saveRecipe } from '../../../../lib/services/recipes'

async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const recipes = await getSavedRecipes(supabase, user.id)
    return NextResponse.json(recipes)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = SavedRecipeSchema.safeParse(await request.json())
  if (!parsed.success) return badRequest(parsed.error)

  try {
    const recipe = await saveRecipe(supabase, user.id, parsed.data)
    return NextResponse.json(recipe)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
