import { NextRequest, NextResponse } from 'next/server'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { getModel, collectStream } from '../../../lib/ai'
import { validateInput } from '../../../lib/guardrails'
import { ShoppingGenerationSchema, badRequest } from '../../../lib/validation'
import { createSupabaseServer } from '../../../lib/supabase-server'
import { ratelimit } from '../../../lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { success, limit, remaining, reset } = await ratelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before generating a new shopping list.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }

    const parsed = ShoppingGenerationSchema.safeParse(await request.json())
    if (!parsed.success) return badRequest(parsed.error)
    const { ingredients, calories, protein, restrictions } = parsed.data

    const inputGuard = await validateInput(ingredients || '')
    if (!inputGuard.valid) {
      return NextResponse.json({ error: inputGuard.reason }, { status: 400 })
    }

    const model = getModel('text')

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a nutritionist named Billo.

      User already has: {ingredients}
      Daily goals: {calories} kcal, {protein}g protein
      Restrictions: {restrictions}

      Generate a weekly shopping list of staples they should always have.
      Return ONLY valid JSON in this exact format:
      {{
        "items": [
          {{"name": "Chicken Breast", "category": "Proteins", "checked": false}},
          {{"name": "Greek Yogurt", "category": "Dairy", "checked": false}},
          {{"name": "Broccoli", "category": "Vegetables", "checked": false}}
        ]
      }}

      Include 15-20 items across categories: Proteins, Vegetables, Dairy, Pantry Staples, Fruits.
      Return ONLY the JSON, no other text.
    `)

    const formattedPrompt = await prompt.formatMessages({
      ingredients: ingredients || 'nothing',
      calories,
      protein,
      restrictions: restrictions || 'none',
    })

    const data = JSON.parse(await collectStream(model, formattedPrompt))
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Shopping API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
