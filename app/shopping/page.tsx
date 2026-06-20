'use client'
import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../../lib/UserContext'
import { apiFetch } from '../../lib/api-client'
import Navbar from '../../components/Navbar'
import ShoppingList from '../../components/ShoppingList'
import { PANTRY_CATEGORIES } from '../../lib/pantryData'

interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

type StockedMap = Record<string, boolean>

export default function ShoppingPage() {
  const { user, loading: authLoading } = useUser()
  const [tab, setTab] = useState<'shopping' | 'pantry'>('shopping')

  const [ingredients, setIngredients] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [restrictions, setRestrictions] = useState('')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [guestPrompt, setGuestPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stocked, setStocked] = useState<StockedMap>({})
  const [search, setSearch] = useState('')
  const [pantrySaving, setPantrySaving] = useState(false)
  const [pantrySaved, setPantrySaved] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }

    setLoading(true)
    Promise.allSettled([
      apiFetch<{ daily_calories: number; daily_protein: number; restrictions: string } | null>('/api/profile'),
      apiFetch<{ items: ShoppingItem[] } | null>('/api/shopping/list'),
      apiFetch<{ item_name: string; is_stocked: boolean }[]>('/api/pantry'),
    ]).then(([profileResult, listResult, pantryResult]) => {
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        const profile = profileResult.value
        setCalories(profile.daily_calories ?? 0)
        setProtein(profile.daily_protein ?? 0)
        setRestrictions(profile.restrictions ?? '')
      }
      if (listResult.status === 'fulfilled' && listResult.value?.items) {
        setItems(listResult.value.items)
      }
      if (pantryResult.status === 'fulfilled') {
        const map: StockedMap = {}
        pantryResult.value.forEach((row) => { map[row.item_name] = row.is_stocked })
        setStocked(map)
      }
      const failed = [profileResult, listResult, pantryResult].find(r => r.status === 'rejected')
      if (failed && failed.status === 'rejected') setError(failed.reason?.message ?? 'Failed to load data')
      setLoading(false)
    })
  }, [user, authLoading])

  const generateList = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setStreaming(true)
    setItems([])

    try {
      const response = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, calories, protein, restrictions }),
      })
      if (!response.body) throw new Error('No response body')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value)
      }
      const clean = accumulated.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      if (parsed.items) setItems(parsed.items)
    } catch (error) {
      console.error(error)
    }
    setStreaming(false)
  }

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item))
  }

  const handleSaveList = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/shopping/list', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
      setMessage('Shopping list saved!')
      setTimeout(() => setMessage(''), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePantry = (item: string) => {
    setStocked((prev) => ({ ...prev, [item]: !prev[item] }))
    setPantrySaved(false)
  }

  const handleSavePantry = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setPantrySaving(true)
    setError(null)
    try {
      await apiFetch('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({ stocked }),
      })
      setPantrySaved(true)
      setTimeout(() => setPantrySaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPantrySaving(false)
    }
  }

  const stockedCount = useMemo(
    () => Object.values(stocked).filter(Boolean).length,
    [stocked]
  )

  const filtered = useMemo(
    () => search.trim()
      ? PANTRY_CATEGORIES.map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => i.toLowerCase().includes(search.toLowerCase())),
        })).filter((cat) => cat.items.length > 0)
      : PANTRY_CATEGORIES,
    [search]
  )

  return (
    <main className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="shopping" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {[{ key: 'shopping', label: '🛒 Shopping List' }, { key: 'pantry', label: '🥦 My Pantry' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                background: tab === t.key ? '#D4AF37' : 'transparent',
                color: tab === t.key ? '#0a3340' : '#9ca3af',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {guestPrompt && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            🐱 <a href="/auth/login" className="underline font-semibold">Sign in</a> to save your data
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {tab === 'shopping' && (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">Shopping List</h1>
            <p className="text-gray-400 mb-8">Generate your weekly staples based on your goals</p>

            <div className="rounded-2xl p-6 mb-8"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <label className="text-white font-semibold block mb-2">What do you already have? (optional)</label>
              <input type="text" value={ingredients} onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. chicken, eggs, broccoli..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 mb-4"
                style={{ background: 'rgba(255,255,255,0.1)' }} />
              <button onClick={generateList} disabled={streaming || loading}
                className="w-full py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
                style={{ background: '#D4AF37', color: '#0a3340' }}>
                {streaming ? '✨ Billo is building your list...' : '✨ Generate Shopping List'}
              </button>
            </div>

            {message && (
              <div className="mb-4 p-3 rounded-xl text-center font-semibold text-green-400"
                style={{ background: 'rgba(74,222,128,0.1)' }}>✅ {message}</div>
            )}

            {items.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-400">{items.filter((i) => !i.checked).length} items remaining</p>
                  <button onClick={handleSaveList} disabled={saving}
                    className="px-6 py-2 rounded-full font-semibold text-sm"
                    style={{ background: '#D4AF37', color: '#0a3340' }}>
                    {saving ? 'Saving...' : '💾 Save List'}
                  </button>
                </div>
                <ShoppingList items={items} onToggle={toggleItem} />
              </>
            )}
          </>
        )}

        {tab === 'pantry' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">My Pantry</h1>
                <p className="text-gray-400 text-sm mt-1">{stockedCount} items stocked</p>
              </div>
              <button onClick={handleSavePantry} disabled={pantrySaving}
                className="px-5 py-2.5 rounded-full font-semibold text-sm transition"
                style={{ background: pantrySaved ? '#4ade80' : '#D4AF37', color: '#0a3340' }}>
                {pantrySaving ? '⏳ Saving...' : pantrySaved ? '✓ Saved' : '💾 Save'}
              </button>
            </div>

            {!user && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm text-center"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                You're browsing as a guest.{' '}
                <a href="/auth/login" className="underline font-semibold">Sign in</a> to save your pantry.
              </div>
            )}

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" placeholder="Search ingredients..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-white placeholder-gray-400 outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
            </div>

            <div className="flex flex-col gap-4">
              {filtered.map((cat) => {
                const catStocked = cat.items.filter((i) => stocked[i]).length
                return (
                  <div key={cat.name} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ background: `${cat.color}18`, borderBottom: `1px solid ${cat.color}30` }}>
                      <span className="font-semibold text-white">{cat.emoji} {cat.name}</span>
                      <span className="text-xs font-medium" style={{ color: cat.color }}>{catStocked}/{cat.items.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {cat.items.map((item) => {
                        const checked = !!stocked[item]
                        return (
                          <button key={item} onClick={() => togglePantry(item)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition"
                            style={{
                              background: checked ? cat.color : 'rgba(255,255,255,0.05)',
                              color: checked ? '#0a3340' : '#d1d5db',
                              fontWeight: checked ? 600 : 400,
                              border: `1px solid ${checked ? cat.color : 'rgba(255,255,255,0.08)'}`,
                            }}>
                            <span>{checked ? '✓' : '○'}</span>{item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
