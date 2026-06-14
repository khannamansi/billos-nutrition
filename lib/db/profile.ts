import { supabase } from '../supabase'

export interface DietProfile {
  daily_calories: number
  daily_protein: number
  restrictions: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('diet_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data: data as DietProfile | null, error }
}

export async function upsertProfile(userId: string, profile: DietProfile) {
  const { error } = await supabase
    .from('diet_profiles')
    .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return { error }
}
