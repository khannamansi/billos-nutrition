import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'

export async function POST(request: NextRequest) {
  try {
    const { ingredients, calories, protein, restrictions } = await request.json()

    if (calories === undefined || protein === undefined) {
      throw new Error('Missing required fields: calories and protein')
    }

    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY
    })

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a friendly nutritionist chef named Billo. 
      
      User's fridge has: {ingredients}
      
      Their daily goals:
      - Calories: {calories} kcal/day
      - Protein: {protein}g/day  
      - Restrictions: {restrictions}
      
      Generate exactly 3 recipes. For each recipe return ONLY valid JSON in this exact format:
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
      
      Return ONLY the JSON, no other text.
    `)

    const formattedPrompt = await prompt.formatMessages({
      ingredients,
      calories,
      protein,
      restrictions: restrictions || 'none'
    })

    const response = await llm.invoke(formattedPrompt)

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)

  } catch (error: any) {
    console.error('Recipe API Error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}