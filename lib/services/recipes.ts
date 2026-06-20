import type { SupabaseClient } from '@supabase/supabase-js'

export interface SavedRecipe {
  id: string
  name: string
  calories: number
  protein: number
  ingredients: string
  instructions: string
  saved_at: string
}

export async function getSavedRecipes(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<SavedRecipe[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveRecipe(
  supabase: SupabaseClient<any>,
  userId: string,
  recipe: { name: string; calories: number; protein: number; ingredients: string; instructions: string },
): Promise<SavedRecipe> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .insert({ user_id: userId, ...recipe, saved_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteSavedRecipe(
  supabase: SupabaseClient<any>,
  userId: string,
  recipeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
