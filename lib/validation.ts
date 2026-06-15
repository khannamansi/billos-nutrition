import { z } from 'zod'
import { NextResponse } from 'next/server'

export const RecipeGenerationSchema = z.object({
  ingredients: z.string().min(1, 'Ingredients are required').max(500, 'Ingredients too long'),
  calories: z.number({ error: 'Calories must be a number' }).int().min(0).max(10000),
  protein: z.number({ error: 'Protein must be a number' }).int().min(0).max(500),
  restrictions: z.string().max(200).optional().default(''),
})

export const ShoppingGenerationSchema = z.object({
  ingredients: z.string().max(500).optional().default(''),
  calories: z.number({ error: 'Calories must be a number' }).int().min(0).max(10000),
  protein: z.number({ error: 'Protein must be a number' }).int().min(0).max(500),
  restrictions: z.string().max(200).optional().default(''),
})

export const MealSchema = z.object({
  meal_name: z.string().min(1, 'Meal name is required').max(200),
  calories: z.number({ error: 'Calories must be a number' }).int().min(0).max(10000),
  protein: z.number({ error: 'Protein must be a number' }).int().min(0).max(500),
  meal_type: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']).optional(),
})

export const ProfileSchema = z.object({
  daily_calories: z.number().int().min(500, 'Minimum 500 kcal').max(10000, 'Maximum 10,000 kcal'),
  daily_protein: z.number().int().min(0).max(500, 'Maximum 500g protein'),
  restrictions: z.string().max(200).optional().default(''),
})

export const PantrySchema = z.object({
  stocked: z.record(z.string().min(1).max(100), z.boolean()).refine(
    (val) => Object.keys(val).length <= 500,
    'Too many pantry items'
  ),
})

export const SavedRecipeSchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().int().min(0).max(500),
  prepTime: z.string().max(50).optional(),
  ingredients: z.string().min(1).max(2000),
  instructions: z.string().min(1).max(5000),
})

export const ShoppingListSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1).max(100),
      category: z.string().max(50),
      checked: z.boolean(),
    })
  ).max(200),
})

export function badRequest(error: z.ZodError) {
  return NextResponse.json(
    { error: 'Invalid input', details: error.flatten().fieldErrors },
    { status: 400 }
  )
}
