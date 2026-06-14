import { supabase } from '../supabase'

export interface MealEntry {
  id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
}

export interface MealInput {
  meal_name: string
  calories: number
  protein: number
}

export async function getMealHistory(userId: string) {
  const { data, error } = await supabase
    .from('meal_history')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
  return { data: data as MealEntry[] | null, error }
}

export async function logMeal(userId: string, meal: MealInput) {
  const { data, error } = await supabase
    .from('meal_history')
    .insert({ user_id: userId, ...meal })
    .select()
    .single()
  return { data: data as MealEntry | null, error }
}

export async function deleteMeal(mealId: string) {
  const { error } = await supabase.from('meal_history').delete().eq('id', mealId)
  return { error }
}
