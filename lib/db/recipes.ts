import { supabase } from '../supabase'

export interface SavedRecipe {
  id: string
  name: string
  calories: number
  protein: number
  prepTime?: string
  instructions: string
  ingredients: string
  saved_at: string
}

export interface RecipeInput {
  name: string
  calories: number
  protein: number
  prepTime?: string
  instructions: string
  ingredients: string
}

export async function getSavedRecipes(userId: string) {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  return { data: data as SavedRecipe[] | null, error }
}

export async function saveRecipe(userId: string, recipe: RecipeInput) {
  const { data, error } = await supabase
    .from('saved_recipes')
    .insert({ user_id: userId, ...recipe })
    .select()
    .single()
  return { data: data as SavedRecipe | null, error }
}

export async function deleteRecipe(recipeId: string) {
  const { error } = await supabase.from('saved_recipes').delete().eq('id', recipeId)
  return { error }
}
