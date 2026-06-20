'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '../../lib/UserContext'
import Navbar from '@/components/Navbar'
import MealHistoryCard from '@/components/MealHistoryCard'
import Link from 'next/link'

interface MealEntry {
  id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
  meal_type?: string
}

interface FoodResult {
  fdcId: number
  description: string
  calories_per_100g: number
  protein_per_100g: number
}

const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'] as const
type MealType = typeof MEAL_TYPES[number]

const MEAL_META: Record<MealType, { emoji: string; label: string }> = {
  breakfast: { emoji: '🌅', label: 'Breakfast' },
  lunch: { emoji: '☀️', label: 'Lunch' },
  snacks: { emoji: '🍎', label: 'Snacks' },
  dinner: { emoji: '🌙', label: 'Dinner' },
}

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

function formatDayHeader(dateKey: string): string {
  const date = new Date(dateKey + 'T12:00:00')
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function dayBounds(dateKey: string): { from: string; to: string } {
  const from = new Date(dateKey + 'T00:00:00').toISOString()
  const to = new Date(dateKey + 'T23:59:59.999').toISOString()
  return { from, to }
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useUser()
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [mealName, setMealName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [serving, setServing] = useState('100')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [guestPrompt, setGuestPrompt] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMeals = async (dateKey: string) => {
    setLoading(true)
    const { from, to } = dayBounds(dateKey)
    const res = await fetch(`/api/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    if (res.ok) {
      const { meals } = await res.json()
      setMeals(meals ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); setLoading(false); return }
    fetchMeals(selectedDate)
  }, [user, authLoading, selectedDate])

  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toLocaleDateString('en-CA'))
  }

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toLocaleDateString('en-CA'))
  }

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
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setAdding(true)
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_name: mealName,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        meal_type: mealType,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (selectedDate === todayKey()) setMeals([data, ...meals])
      setMealName('')
      setCalories('')
      setProtein('')
      setServing('100')
      setQuery('')
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/meals/${id}`, { method: 'DELETE' })
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  const isToday = selectedDate === todayKey()
  const isFuture = selectedDate > todayKey()
  const dayCalories = meals.reduce((s, m) => s + m.calories, 0)
  const dayProtein = meals.reduce((s, m) => s + m.protein, 0)

  const byType: Record<string, MealEntry[]> = {}
  for (const meal of meals) {
    const type = meal.meal_type ?? 'other'
    if (!byType[type]) byType[type] = []
    byType[type].push(meal)
  }
  const slotsToRender: string[] = isToday
    ? [...MEAL_TYPES, ...('other' in byType ? ['other'] : [])]
    : [...MEAL_TYPES.filter(t => t in byType), ...('other' in byType ? ['other'] : [])]

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="history" />

      {guestPrompt && (
        <div className="mx-auto max-w-3xl px-4 md:px-8 mt-4">
          <div className="p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            🐱 <Link href="/auth/login" className="underline font-semibold">Sign in</Link> to log your meals
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex justify-between items-center mb-6">
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

        {/* Day navigator */}
        <div className="flex items-center justify-between mb-6 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={goToPrevDay}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white font-bold text-lg leading-none">
            ‹
          </button>

          <div className="text-center">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={todayKey()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="opacity-0 absolute w-0 h-0"
            />
            <button onClick={() => dateInputRef.current?.showPicker()}
              className="text-white font-semibold text-base hover:text-yellow-400 transition">
              {isToday ? 'Today' : formatDayHeader(selectedDate)}
            </button>
            {!isToday && (
              <button onClick={() => setSelectedDate(todayKey())}
                className="block mx-auto text-xs mt-0.5 hover:text-yellow-400 transition"
                style={{ color: '#D4AF37' }}>
                Go to today
              </button>
            )}
          </div>

          <button onClick={goToNextDay} disabled={isToday || isFuture}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white font-bold text-lg leading-none disabled:opacity-30">
            ›
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div className="text-3xl font-bold text-white">{dayCalories}</div>
            <div className="text-yellow-400 text-sm mt-1">🔥 Calories</div>
          </div>
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <div className="text-3xl font-bold text-white">{dayProtein}g</div>
            <div className="text-green-400 text-sm mt-1">💪 Protein</div>
          </div>
        </div>

        {showForm && (
          <div className="rounded-2xl p-6 mb-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <h3 className="text-white font-bold mb-4">Log a Meal</h3>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className="py-2 rounded-xl text-center transition"
                  style={{
                    background: mealType === type ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                    color: mealType === type ? '#0a3340' : '#9ca3af',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div>{MEAL_META[type].emoji}</div>
                  <div className="text-xs font-semibold mt-0.5">{MEAL_META[type].label}</div>
                </button>
              ))}
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="🔍 Search food (e.g. chicken breast)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                onFocus={() => { if (results.length > 0) setShowResults(true) }}
                className="w-full px-4 py-3 pr-10 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
              {searching && (
                <span className="absolute right-3 top-3 text-gray-400 text-sm">Searching...</span>
              )}
              {query && !searching && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); setQuery(''); setResults([]); setShowResults(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-lg leading-none">
                  ✕
                </button>
              )}
              {showResults && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-y-auto shadow-xl"
                  style={{ background: '#0a3340', border: '1px solid rgba(212,175,55,0.3)', maxHeight: '260px' }}>
                  {results.map((food) => (
                    <button
                      key={food.fdcId}
                      onMouseDown={(e) => { e.preventDefault(); selectFood(food) }}
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
              <div className="relative">
                <input type="text" placeholder="Meal name" value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 pr-10"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
                {mealName && (
                  <button
                    onClick={() => { setMealName(''); setCalories(''); setProtein(''); setServing('100'); setQuery('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-lg leading-none">
                    ✕
                  </button>
                )}
              </div>
              <div className={`grid gap-3 grid-cols-1 ${results.length > 0 || serving !== '100' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <input type="number" placeholder="Calories" value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
                <input type="number" placeholder="Protein (g)" value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
                {(results.length > 0 || serving !== '100') && (
                  <input type="number" placeholder="Serving (g)" value={serving}
                    onChange={(e) => recalcServing(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
                    style={{ background: 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
              <button onClick={addMeal} disabled={adding || !mealName.trim()}
                className="w-full py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{ background: added ? '#4ade80' : '#D4AF37', color: '#0a3340' }}>
                {adding ? 'Logging...' : added ? '✓ Added! Log another?' : '✅ Log Meal'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : (
          <div className="space-y-5">
            {slotsToRender.length === 0 && !isToday ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-white font-bold text-xl mb-2">No meals logged</p>
                <p className="text-gray-400">Nothing was tracked on this day</p>
              </div>
            ) : (
              slotsToRender.map((slotType) => {
                const slotMeals = byType[slotType] ?? []
                const meta = slotType === 'other'
                  ? { emoji: '🍽️', label: 'Other' }
                  : MEAL_META[slotType as MealType]
                const slotCalories = slotMeals.reduce((s: number, m: MealEntry) => s + m.calories, 0)
                const slotProtein = slotMeals.reduce((s: number, m: MealEntry) => s + m.protein, 0)

                return (
                  <div key={slotType}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                        {meta.emoji} {meta.label}
                      </span>
                      {slotMeals.length > 0 && (
                        <span className="text-gray-400 text-xs">
                          {slotCalories} kcal · {slotProtein}g protein
                        </span>
                      )}
                    </div>
                    {slotMeals.length === 0 ? (
                      <p className="text-gray-600 text-sm pl-1">Nothing logged yet</p>
                    ) : (
                      <div className="space-y-2">
                        {slotMeals.map((meal) => (
                          <MealHistoryCard key={meal.id} meal={meal} onDelete={handleDelete} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </main>
  )
}
