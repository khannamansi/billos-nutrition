'use client'
import { useState, useEffect } from 'react'
import { useUser } from '../../lib/UserContext'
import Navbar from '@/components/Navbar'
import RecipeCard from '@/components/RecipeCard'

interface SavedRecipe {
  id: string
  name: string
  calories: number
  protein: number
  prepTime?: string
  ingredients: string
  instructions: string
  saved_at: string
}

export default function SavedPage() {
  const { user, loading: authLoading } = useUser()
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    fetch('/api/recipes/saved').then(async res => {
      if (res.ok) setRecipes(await res.json())
      setLoading(false)
    })
  }, [user, authLoading])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/recipes/saved/${id}`, { method: 'DELETE' })
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    setDeleting(null)
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="saved" />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">❤️ Saved Recipes</h1>
        <p className="text-gray-400 mb-8">Your favorite recipes from Billo</p>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading your recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white font-bold text-xl mb-2">No saved recipes yet</p>
            <p className="text-gray-400 mb-6">Generate some recipes and save your favorites!</p>
            <a href="/recipes" className="px-6 py-3 rounded-full font-semibold"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Generate Recipes
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe} />
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-gray-500 text-xs">
                    Saved {new Date(recipe.saved_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    disabled={deleting === recipe.id}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition"
                    style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid #f87171' }}>
                    {deleting === recipe.id ? 'Removing...' : '🗑️ Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
