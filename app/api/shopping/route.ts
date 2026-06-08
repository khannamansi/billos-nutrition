import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'

export async function POST(request: NextRequest) {
  try {
    const { ingredients, calories, protein, restrictions } = await request.json()

    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY
    })

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
      restrictions: restrictions || 'none'
    })

    const response = await llm.invoke(formattedPrompt)
    const content = response.content as string
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Shopping API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}