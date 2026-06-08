export interface DietProfile {
  id: string
  user_id: string
  daily_calories: number
  daily_protein: number
  restrictions: string
  updated_at: string
}

export interface SavedRecipe {
  id: string
  user_id: string
  name: string
  calories: number
  protein: number
  instructions: string
  ingredients: string
  saved_at: string
}

export interface ShoppingList {
  id: string
  user_id: string
  items: ShoppingItem[]
  created_at: string
}

export interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

export interface MealHistory {
  id: string
  user_id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
}