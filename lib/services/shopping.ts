import type { SupabaseClient } from '@supabase/supabase-js'

export interface ShoppingList {
  id: string
  items: string
  created_at: string
}

export async function getShoppingList(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ?? null
}

export async function saveShoppingList(
  supabase: SupabaseClient<any>,
  userId: string,
  items: string,
): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: userId, items })

  if (error) throw new Error(error.message)
}
