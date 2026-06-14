'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '@/components/Navbar'

interface Recipe {
  name: string
  calories: number
  protein: number
  prepTime: string
  ingredients: string
  instructions: string
}

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [restrictions, setRestrictions] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [guestPrompt, setGuestPrompt] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }

      const { data } = await supabase
        .from('diet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setCalories(data.daily_calories ?? 0)
        setProtein(data.daily_protein ?? 0)
        setRestrictions(data.restrictions ?? '')
      }
    }
    loadProfile()
  }, [])

  const generateRecipes = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    if (!ingredients.trim()) return
    setLoading(true)
    setRecipes([])

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, calories, protein, restrictions })
      })
      const data = await response.json()
      if (data.recipes) setRecipes(data.recipes)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const saveRecipe = async (recipe: Recipe) => {
    setSaving(recipe.name)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }

    const { error } = await supabase.from('saved_recipes').insert({
      user_id: user.id,
      name: recipe.name,
      calories: recipe.calories,
      protein: recipe.protein,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients
    })

    if (!error) {
      setSavedMessage(recipe.name)
      setTimeout(() => setSavedMessage(null), 2000)
    }
    setSaving(null)
  }

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <Navbar active="recipes" />
      
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">🍳 Recipe Generator</h1>
        <p className="text-gray-400 mb-8">Tell Billo what's in your fridge!</p>

        {/* Input Section */}
        <div className="rounded-2xl p-6 mb-8"
          style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
          
          <label className="text-white font-semibold block mb-2">What's in your fridge?</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. chicken breast, broccoli, eggs, greek yogurt, mushrooms..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 resize-none mb-4"
            style={{background: 'rgba(255,255,255,0.1)'}}
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.05)'}}>
              <div className="text-yellow-400 font-bold">{calories} kcal</div>
              <div className="text-gray-400 text-xs">Daily Calories</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.05)'}}>
              <div className="text-yellow-400 font-bold">{protein}g</div>
              <div className="text-gray-400 text-xs">Daily Protein</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.05)'}}>
              <div className="text-yellow-400 font-bold">{restrictions || 'None'}</div>
              <div className="text-gray-400 text-xs">Restrictions</div>
            </div>
          </div>

          <button onClick={generateRecipes} disabled={loading || !ingredients.trim()}
            className="w-full py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            {loading ? '🤔 Billo is thinking...' : '✨ Generate Recipes'}
          </button>
        </div>

        {/* Recipes */}
        {savedMessage && (
          <div className="mb-4 p-3 rounded-xl text-center font-semibold text-green-400"
            style={{background: 'rgba(74,222,128,0.1)'}}>
            ✅ {savedMessage} saved to favorites!
          </div>
        )}

        {recipes.length > 0 && (
          <div className="space-y-6">
            {recipes.map((recipe, i) => (
              <div key={i} className="rounded-2xl p-6"
                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}>
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white font-bold text-xl">{recipe.name}</h3>
                  <button onClick={() => saveRecipe(recipe)}
                    disabled={saving === recipe.name}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition"
                    style={{background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid #D4AF37'}}>
                    {saving === recipe.name ? 'Saving...' : '❤️ Save'}
                  </button>
                </div>

                <div className="flex gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{background: 'rgba(212,175,55,0.2)', color: '#D4AF37'}}>
                    🔥 {recipe.calories} kcal
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{background: 'rgba(74,222,128,0.2)', color: '#4ade80'}}>
                    💪 {recipe.protein}g protein
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{background: 'rgba(96,165,250,0.2)', color: '#60a5fa'}}>
                    ⏱️ {recipe.prepTime}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm font-semibold mb-1">Ingredients:</p>
                  <p className="text-gray-300 text-sm">{recipe.ingredients}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm font-semibold mb-1">Instructions:</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{recipe.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}