'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface SavedRecipe {
  id: string
  name: string
  calories: number
  protein: number
  instructions: string
  ingredients: string
  saved_at: string
}

export default function SavedPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const loadSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const { data } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })

      if (data) setRecipes(data)
      setLoading(false)
    }
    loadSaved()
  }, [])

  const deleteRecipe = async (id: string) => {
    setDeleting(id)
    await supabase.from('saved_recipes').delete().eq('id', id)
    setRecipes(recipes.filter(r => r.id !== id))
    setDeleting(null)
  }

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <nav className="flex justify-between items-center px-8 py-5 border-b border-white/10">
        <a href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🐘</span>
          <span className="text-white font-bold text-lg">Billo's Nutrition</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/recipes" className="text-gray-300 hover:text-white text-sm">Recipes</a>
          <a href="/shopping" className="text-gray-300 hover:text-white text-sm">Shopping</a>
          <a href="/history" className="text-gray-300 hover:text-white text-sm">History</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">❤️ Saved Recipes</h1>
        <p className="text-gray-400 mb-8">Your favorite recipes from Billo</p>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading your recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{background: 'rgba(255,255,255,0.05)'}}>
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white font-bold text-xl mb-2">No saved recipes yet</p>
            <p className="text-gray-400 mb-6">Generate some recipes and save your favorites!</p>
            <a href="/recipes"
              className="px-6 py-3 rounded-full font-semibold"
              style={{background: '#D4AF37', color: '#0a3340'}}>
              Generate Recipes
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="rounded-2xl p-6"
                style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}>
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-white font-bold text-xl">{recipe.name}</h3>
                  <button onClick={() => deleteRecipe(recipe.id)}
                    disabled={deleting === recipe.id}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition"
                    style={{background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid #f87171'}}>
                    {deleting === recipe.id ? 'Removing...' : '🗑️ Remove'}
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
                    style={{background: 'rgba(255,255,255,0.1)', color: '#9ca3af'}}>
                    {new Date(recipe.saved_at).toLocaleDateString()}
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