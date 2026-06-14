'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '@/components/Navbar'
import RecipeCard from '@/components/RecipeCard'

interface Recipe {
  name: string
  calories: number
  protein: number
  prepTime?: string
  ingredients: string
  instructions: string
}

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [restrictions, setRestrictions] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamProgress, setStreamProgress] = useState(0)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [guestPrompt, setGuestPrompt] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setCalories(data.daily_calories ?? 0)
          setProtein(data.daily_protein ?? 0)
          setRestrictions(data.restrictions ?? '')
        }
      }
    }
    init()
  }, [])

  const generateRecipes = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    if (!ingredients.trim()) return

    setStreaming(true)
    setStreamProgress(0)
    setRecipes([])

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, calories, protein, restrictions }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let chars = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        accumulated += chunk
        chars += chunk.length
        setStreamProgress(Math.min(chars, 800))
      }

      const clean = accumulated.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed.recipes) setRecipes(parsed.recipes)
    } catch (error) {
      console.error(error)
    }

    setStreaming(false)
    setStreamProgress(0)
  }

  const handleSave = async (recipe: Recipe) => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setSaving(recipe.name)
    const res = await fetch('/api/recipes/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    })
    if (res.ok) setSavedNames((prev) => new Set(prev).add(recipe.name))
    setSaving(null)
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="recipes" />

      {guestPrompt && (
        <div className="mx-auto max-w-4xl px-8 mt-4">
          <div className="p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            🐱 <a href="/auth/login" className="underline font-semibold">Sign in</a> to generate and save recipes
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">🍳 Recipe Generator</h1>
        <p className="text-gray-400 mb-8">Tell Billo what's in your fridge!</p>

        <div className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <label className="text-white font-semibold block mb-2">What's in your fridge?</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. chicken breast, broccoli, eggs, greek yogurt, mushrooms..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 resize-none mb-4"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Daily Calories', value: `${calories} kcal` },
              { label: 'Daily Protein', value: `${protein}g` },
              { label: 'Restrictions', value: restrictions || 'None' },
            ].map((g) => (
              <div key={g.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-yellow-400 font-bold">{g.value}</div>
                <div className="text-gray-400 text-xs">{g.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={generateRecipes}
            disabled={streaming || !ingredients.trim()}
            className="w-full py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            {streaming ? '✨ Billo is thinking...' : '✨ Generate Recipes'}
          </button>

          {streaming && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Generating recipes...</span>
                <span>{Math.round((streamProgress / 800) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((streamProgress / 800) * 100, 95)}%`, background: '#D4AF37' }}
                />
              </div>
            </div>
          )}
        </div>

        {recipes.length > 0 && (
          <div className="space-y-6">
            {recipes.map((recipe, i) => (
              <RecipeCard
                key={i}
                recipe={recipe}
                onSave={handleSave}
                saving={saving === recipe.name}
                saved={savedNames.has(recipe.name)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
