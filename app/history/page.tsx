'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface MealHistory {
  id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const { data } = await supabase
      .from('meal_history')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (data) setMeals(data)
    setLoading(false)
  }

  const addMeal = async () => {
    if (!mealName.trim()) return
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('meal_history')
      .insert({
        user_id: user.id,
        meal_name: mealName,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0
      })
      .select()
      .single()

    if (!error && data) {
      setMeals([data, ...meals])
      setMealName('')
      setCalories('')
      setProtein('')
      setShowForm(false)
    }
    setAdding(false)
  }

  const deleteMeal = async (id: string) => {
    await supabase.from('meal_history').delete().eq('id', id)
    setMeals(meals.filter(m => m.id !== id))
  }

  const todaysMeals = meals.filter(m =>
    new Date(m.logged_at).toDateString() === new Date().toDateString()
  )
  const todaysCalories = todaysMeals.reduce((sum, m) => sum + m.calories, 0)
  const todaysProtein = todaysMeals.reduce((sum, m) => sum + m.protein, 0)

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
          <a href="/saved" className="text-gray-300 hover:text-white text-sm">Saved</a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-white">📊 Meal History</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 rounded-full font-semibold text-sm"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            + Log Meal
          </button>
        </div>
        <p className="text-gray-400 mb-8">Track what you've eaten today</p>

        {/* Today's Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 text-center"
            style={{background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)'}}>
            <div className="text-3xl font-bold text-white">{todaysCalories}</div>
            <div className="text-yellow-400 text-sm mt-1">🔥 Calories Today</div>
          </div>
          <div className="rounded-2xl p-5 text-center"
            style={{background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)'}}>
            <div className="text-3xl font-bold text-white">{todaysProtein}g</div>
            <div className="text-green-400 text-sm mt-1">💪 Protein Today</div>
          </div>
        </div>

        {/* Add Meal Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-8"
            style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
            <h3 className="text-white font-bold mb-4">Log a Meal</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Meal name"
                value={mealName} onChange={(e) => setMealName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                style={{background: 'rgba(255,255,255,0.1)'}}
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Calories"
                  value={calories} onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                />
                <input type="number" placeholder="Protein (g)"
                  value={protein} onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{background: 'rgba(255,255,255,0.1)'}}
                />
              </div>
              <button onClick={addMeal} disabled={adding || !mealName.trim()}
                className="w-full py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{background: '#D4AF37', color: '#0a3340'}}>
                {adding ? 'Logging...' : '✅ Log Meal'}
              </button>
            </div>
          </div>
        )}

        {/* Meal List */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading history...</div>
        ) : meals.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{background: 'rgba(255,255,255,0.05)'}}>
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-white font-bold text-xl mb-2">No meals logged yet</p>
            <p className="text-gray-400">Start tracking what you eat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <div key={meal.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{background: 'rgba(255,255,255,0.08)'}}>
                <div>
                  <p className="text-white font-semibold">{meal.meal_name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(meal.logged_at).toLocaleDateString()} · {new Date(meal.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-yellow-400 text-sm font-semibold">{meal.calories} kcal</p>
                    <p className="text-green-400 text-xs">{meal.protein}g protein</p>
                  </div>
                  <button onClick={() => deleteMeal(meal.id)}
                    className="text-gray-500 hover:text-red-400 transition text-lg">
                    ✕
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