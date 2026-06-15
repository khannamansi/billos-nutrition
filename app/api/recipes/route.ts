import { NextRequest, NextResponse } from 'next/server'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { createModel } from '../../../lib/langchain'
import { RecipeGenerationSchema, badRequest } from '../../../lib/validation'
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
        { error: 'Too many requests. Please wait before generating more recipes.' },
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

    const parsed = RecipeGenerationSchema.safeParse(await request.json())
    if (!parsed.success) return badRequest(parsed.error)
    const { ingredients, calories, protein, restrictions } = parsed.data

    const model = createModel(0.7)

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a friendly nutritionist chef named Billo.

      User's fridge has: {ingredients}

      Their daily goals:
      - Calories: {calories} kcal/day
      - Protein: {protein}g/day
      - Restrictions: {restrictions}

      Generate exactly 3 recipes. Return ONLY valid JSON in this exact format, no other text:
      {{
        "recipes": [
          {{
            "name": "Recipe Name",
            "calories": 450,
            "protein": 35,
            "prepTime": "15 minutes",
            "ingredients": "ingredient 1, ingredient 2, ingredient 3",
            "instructions": "Step 1: Do this. Step 2: Do that. Step 3: Serve and enjoy."
          }}
        ]
      }}
    `)

    const formattedPrompt = await prompt.formatMessages({
      ingredients,
      calories,
      protein,
      restrictions: restrictions || 'none',
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const langStream = await model.stream(formattedPrompt)
        for await (const chunk of langStream) {
          const text = typeof chunk.content === 'string' ? chunk.content : ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    console.error('Recipe API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
