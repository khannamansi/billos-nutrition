import { supabase } from '../supabase'

export interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

export async function getLatestShoppingList(userId: string) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return { data, error }
}

export async function saveShoppingList(userId: string, items: ShoppingItem[]) {
  const { error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: userId, items })
  return { error }
}
