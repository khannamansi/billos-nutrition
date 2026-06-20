import type { SupabaseClient } from '@supabase/supabase-js'

export interface MealEntry {
  id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
  meal_type?: string
}

interface GetMealsOptions {
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function getMeals(
  supabase: SupabaseClient<any>,
  userId: string,
  options: GetMealsOptions = {},
): Promise<{ meals: MealEntry[]; total: number }> {
  const { from, to, page = 1, limit = 20 } = options

  let query = supabase
    .from('meal_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })

  if (from) query = query.gte('logged_at', from)
  if (to) query = query.lte('logged_at', to)

  if (!from && !to) {
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { meals: data ?? [], total: count ?? 0 }
}

export async function createMeal(
  supabase: SupabaseClient<any>,
  userId: string,
  meal: { meal_name: string; calories: number; protein: number; meal_type?: string },
): Promise<MealEntry> {
  const { data, error } = await supabase
    .from('meal_history')
    .insert({ user_id: userId, ...meal, logged_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteMeal(
  supabase: SupabaseClient<any>,
  userId: string,
  mealId: string,
): Promise<void> {
  const { error } = await supabase
    .from('meal_history')
    .delete()
    .eq('id', mealId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
