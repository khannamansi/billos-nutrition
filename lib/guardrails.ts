import { getModel } from './ai'

export interface GuardResult {
  valid: boolean
  reason?: string
  invalid?: Recipe[]
}

export interface Recipe {
  name: string
  calories: number
  protein: number
  prepTime: string
  ingredients: string
  instructions: string
}

const MACRO_LIMITS = {
  calories: { min: 50, max: 3000 },
  protein: { min: 0, max: 200 },
}

const CLASSIFICATION_PROMPT = `You are a strict food-relevance classifier.
Reply with exactly one word: YES if the input is food, ingredients, meals, or nutrition-related. NO otherwise.
Do not explain. Do not add punctuation.`

export async function validateInput(text: string): Promise<GuardResult> {
  if (!text.trim()) {
    return { valid: false, reason: 'Input is empty' }
  }

  try {
    const model = getModel('text')
    const response = await model.invoke([
      { role: 'system', content: CLASSIFICATION_PROMPT },
      { role: 'user', content: text },
    ])
    const answer = (response.content as string).trim().toUpperCase()
    if (answer.startsWith('YES')) return { valid: true }
    return { valid: false, reason: 'Input does not appear to be food or nutrition related' }
  } catch {
    // fail open — guardrails should not make the app more fragile than the underlying model
    return { valid: true }
  }
}

export function validateOutput(recipes: Recipe[]): GuardResult {
  const invalid = recipes.filter(
    (r) =>
      r.calories < MACRO_LIMITS.calories.min ||
      r.calories > MACRO_LIMITS.calories.max ||
      r.protein < MACRO_LIMITS.protein.min ||
      r.protein > MACRO_LIMITS.protein.max
  )

  if (invalid.length === 0) return { valid: true }
  return { valid: false, invalid }
}
