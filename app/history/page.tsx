'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getMealHistory, logMeal, deleteMeal, type MealEntry } from '../../lib/db/meals'
import Navbar from '@/components/Navbar'
import MealHistoryCard from '@/components/MealHistoryCard'

interface FoodResult {
  fdcId: number
  description: string
  calories_per_100g: number
  protein_per_100g: number
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [serving, setServing] = useState('100')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [guestPrompt, setGuestPrompt] = useState(false)

  // USDA search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); setLoading(false); return }
      const { data } = await getMealHistory(user.id)
      if (data) setMeals(data)
      setLoading(false)
    }
    init()
  }, [])

  // Debounced USDA search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (query.length < 2) { setResults([]); setShowResults(false); return }

    searchRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.foods ?? [])
        setShowResults(true)
      } catch {
        setResults([])
      }
      setSearching(false)
    }, 400)

    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [query])

  const selectFood = (food: FoodResult) => {
    const servingG = parseFloat(serving) || 100
    const ratio = servingG / 100
    setMealName(food.description)
    setCalories(String(Math.round(food.calories_per_100g * ratio)))
    setProtein(String(Math.round(food.protein_per_100g * ratio)))
    setQuery('')
    setShowResults(false)
  }

  const recalcServing = (newServing: string) => {
    setServing(newServing)
    const servingG = parseFloat(newServing) || 100
    const selected = results.find((f) => f.description === mealName)
    if (selected) {
      const ratio = servingG / 100
      setCalories(String(Math.round(selected.calories_per_100g * ratio)))
      setProtein(String(Math.round(selected.protein_per_100g * ratio)))
    }
  }

  const addMeal = async () => {
    if (!mealName.trim()) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); setAdding(false); return }

    const { data, error } = await logMeal(user.id, {
      meal_name: mealName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
    })

    if (!error && data) {
      setMeals([data, ...meals])
      setMealName('')
      setCalories('')
      setProtein('')
      setServing('100')
      setShowForm(false)
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    await deleteMeal(id)
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  const todaysMeals = meals.filter(
    (m) => new Date(m.logged_at).toDateString() === new Date().toDateString()
  )
  const todaysCalories = todaysMeals.reduce((s, m) => s + m.calories, 0)
  const todaysProtein = todaysMeals.reduce((s, m) => s + m.protein, 0)

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="history" />

      {guestPrompt && (
        <div className="mx-auto max-w-3xl px-8 mt-4">
          <div className="p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            🐱 <a href="/auth/login" className="underline font-semibold">Sign in</a> to log your meals
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-white">📊 Meal History</h1>
          <button
            onClick={() => {
              if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
              setShowForm(!showForm)
            }}
            className="px-6 py-2 rounded-full font-semibold text-sm"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            + Log Meal
          </button>
        </div>
        <p className="text-gray-400 mb-8">Track what you've eaten today</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div className="text-3xl font-bold text-white">{todaysCalories}</div>
            <div className="text-yellow-400 text-sm mt-1">🔥 Calories Today</div>
          </div>
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <div className="text-3xl font-bold text-white">{todaysProtein}g</div>
            <div className="text-green-400 text-sm mt-1">💪 Protein Today</div>
          </div>
        </div>

        {showForm && (
          <div className="rounded-2xl p-6 mb-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <h3 className="text-white font-bold mb-4">Log a Meal</h3>

            {/* USDA search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="🔍 Search food (e.g. chicken breast)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
              {searching && (
                <span className="absolute right-3 top-3 text-gray-400 text-sm">Searching...</span>
              )}
              {showResults && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: '#0a3340', border: '1px solid rgba(212,175,55,0.3)' }}>
                  {results.map((food) => (
                    <button
                      key={food.fdcId}
                      onClick={() => selectFood(food)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 transition border-b border-white/5 last:border-0">
                      <p className="text-white text-sm font-medium truncate">{food.description}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {food.calories_per_100g} kcal · {food.protein_per_100g}g protein per 100g
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Meal name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
                <input
                  type="number"
                  placeholder="Serving (g)"
                  value={serving}
                  onChange={(e) => recalcServing(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <button
                onClick={addMeal}
                disabled={adding || !mealName.trim()}
                className="w-full py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{ background: '#D4AF37', color: '#0a3340' }}>
                {adding ? 'Logging...' : '✅ Log Meal'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading history...</div>
        ) : meals.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white font-bold text-xl mb-2">No meals logged yet</p>
            <p className="text-gray-400">Start tracking what you eat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealHistoryCard key={meal.id} meal={meal} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
