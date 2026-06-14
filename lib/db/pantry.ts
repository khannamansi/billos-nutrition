import { supabase } from '../supabase'

export interface PantryItem {
  item_name: string
  category: string
  is_stocked: boolean
}

export async function getPantryItems(userId: string) {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('item_name, is_stocked')
    .eq('user_id', userId)
  return { data, error }
}

export async function savePantryItems(userId: string, items: PantryItem[]) {
  const { error } = await supabase
    .from('pantry_items')
    .upsert(
      items.map((item) => ({ user_id: userId, ...item, updated_at: new Date().toISOString() })),
      { onConflict: 'user_id,item_name' }
    )
  return { error }
}
