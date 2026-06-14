import { NextRequest } from 'next/server'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { createModel } from '../../../lib/langchain'

export async function POST(request: NextRequest) {
  try {
    const { ingredients, calories, protein, restrictions } = await request.json()

    if (calories === undefined || protein === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: calories and protein' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const model = createModel(0.7)

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
    console.error('Shopping API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
