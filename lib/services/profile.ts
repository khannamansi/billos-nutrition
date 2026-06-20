import type { SupabaseClient } from '@supabase/supabase-js'

export interface DietProfile {
  user_id: string
  daily_calories: number
  daily_protein: number
  restrictions: string
  updated_at: string
}

export async function getProfile(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<DietProfile | null> {
  const { data, error } = await supabase
    .from('diet_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ?? null
}

export async function upsertProfile(
  supabase: SupabaseClient<any>,
  userId: string,
  profile: Pick<DietProfile, 'daily_calories' | 'daily_protein' | 'restrictions'>,
): Promise<void> {
  const { error } = await supabase
    .from('diet_profiles')
    .upsert(
      { user_id: userId, ...profile, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) throw new Error(error.message)
}
