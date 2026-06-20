import type { SupabaseClient } from '@supabase/supabase-js'

export interface PantryItem {
  item_name: string
  is_stocked: boolean
}

export async function getPantryItems(
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('item_name, is_stocked')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertPantryItems(
  supabase: SupabaseClient<any>,
  userId: string,
  stocked: Record<string, boolean>,
  getCategoryForItem: (itemName: string) => string,
): Promise<void> {
  const upserts = Object.entries(stocked).map(([item_name, is_stocked]) => ({
    user_id: userId,
    item_name,
    category: getCategoryForItem(item_name),
    is_stocked,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('pantry_items')
    .upsert(upserts, { onConflict: 'user_id,item_name' })

  if (error) throw new Error(error.message)
}
