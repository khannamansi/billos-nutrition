'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { PANTRY_CATEGORIES } from '../../lib/pantryData'

interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

type StockedMap = Record<string, boolean>

export default function ShoppingPage() {
  const [tab, setTab] = useState<'shopping' | 'pantry'>('shopping')
  const [user, setUser] = useState<any>(null)

  // Shopping state
  const [ingredients, setIngredients] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [restrictions, setRestrictions] = useState('')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [guestPrompt, setGuestPrompt] = useState(false)

  // Pantry state
  const [stocked, setStocked] = useState<StockedMap>({})
  const [search, setSearch] = useState('')
  const [pantrySaving, setPantrySaving] = useState(false)
  const [pantrySaved, setPantrySaved] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

      const { data: profile } = await supabase
        .from('diet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setCalories(profile.daily_calories)
        setProtein(profile.daily_protein)
        setRestrictions(profile.restrictions)
      }

      const { data: savedList } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (savedList) setItems(savedList.items)

      const { data: pantryData } = await supabase
        .from('pantry_items')
        .select('item_name, is_stocked')
        .eq('user_id', user.id)

      if (pantryData) {
        const map: StockedMap = {}
        pantryData.forEach((row) => { map[row.item_name] = row.is_stocked })
        setStocked(map)
      }
    }
    loadData()
  }, [])

  const generateList = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setLoading(true)
    setItems([])
    try {
      const response = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, calories, protein, restrictions })
      })
      const data = await response.json()
      if (data.items) setItems(data.items)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const toggleItem = (index: number) => {
    const updated = [...items]
    updated[index].checked = !updated[index].checked
    setItems(updated)
  }

  const saveList = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setSaving(true)
    const { error } = await supabase.from('shopping_lists').insert({ user_id: user.id, items })
    if (!error) { setMessage('Shopping list saved!'); setTimeout(() => setMessage(''), 2000) }
    setSaving(false)
  }

  const togglePantry = (item: string) => {
    setStocked((prev) => ({ ...prev, [item]: !prev[item] }))
    setPantrySaved(false)
  }

  const savePantry = async () => {
    if (!user) { setGuestPrompt(true); setTimeout(() => setGuestPrompt(false), 3000); return }
    setPantrySaving(true)
    const upserts = Object.entries(stocked).map(([item_name, is_stocked]) => ({
      user_id: user.id,
      item_name,
      category: PANTRY_CATEGORIES.find((c) => c.items.includes(item_name))?.name ?? 'Other',
      is_stocked,
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('pantry_items').upsert(upserts, { onConflict: 'user_id,item_name' })
    setPantrySaving(false)
    setPantrySaved(true)
    setTimeout(() => setPantrySaved(false), 2000)
  }

  const stockedCount = Object.values(stocked).filter(Boolean).length
  const filtered = search.trim()
    ? PANTRY_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.toLowerCase().includes(search.toLowerCase())),
      })).filter((cat) => cat.items.length > 0)
    : PANTRY_CATEGORIES

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <main className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="shopping" />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {[{ key: 'shopping', label: '🛒 Shopping List' }, { key: 'pantry', label: '🥦 My Pantry' }].map((t) => (
            <button key={t.key}
              onClick={() => setTab(t.key as any)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                background: tab === t.key ? '#D4AF37' : 'transparent',
                color: tab === t.key ? '#0a3340' : '#9ca3af',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Guest prompt */}
        {guestPrompt && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            🐱 <a href="/auth/login" className="underline font-semibold">Sign in</a> to save your data
          </div>
        )}

        {/* SHOPPING TAB */}
        {tab === 'shopping' && (
          <>
            <h1 className="text-3xl font-bold text-white mb-2">Shopping List</h1>
            <p className="text-gray-400 mb-8">Generate your weekly staples based on your goals</p>

            <div className="rounded-2xl p-6 mb-8"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <label className="text-white font-semibold block mb-2">What do you already have? (optional)</label>
              <input type="text" value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. chicken, eggs, broccoli..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 mb-4"
                style={{ background: 'rgba(255,255,255,0.1)' }} />
              <button onClick={generateList} disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
                style={{ background: '#D4AF37', color: '#0a3340' }}>
                {loading ? '🤔 Billo is building your list...' : '✨ Generate Shopping List'}
              </button>
            </div>

            {message && (
              <div className="mb-4 p-3 rounded-xl text-center font-semibold text-green-400"
                style={{ background: 'rgba(74,222,128,0.1)' }}>✅ {message}</div>
            )}

            {items.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-400">{items.filter(i => !i.checked).length} items remaining</p>
                  <button onClick={saveList} disabled={saving}
                    className="px-6 py-2 rounded-full font-semibold text-sm"
                    style={{ background: '#D4AF37', color: '#0a3340' }}>
                    {saving ? 'Saving...' : '💾 Save List'}
                  </button>
                </div>
                {categories.map(category => (
                  <div key={category} className="mb-6">
                    <h3 className="font-bold text-lg mb-3" style={{ color: '#D4AF37' }}>{category}</h3>
                    <div className="space-y-2">
                      {items.map((item, index) => ({ ...item, index }))
                        .filter(item => item.category === category)
                        .map((item) => (
                          <div key={item.index} onClick={() => toggleItem(item.index)}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-white/10"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: item.checked ? '#4ade80' : '#D4AF37', background: item.checked ? '#4ade80' : 'transparent' }}>
                              {item.checked && <span className="text-xs text-black">✓</span>}
                            </div>
                            <span className="text-sm"
                              style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? '#6b7280' : 'white' }}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* PANTRY TAB */}
        {tab === 'pantry' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">My Pantry</h1>
                <p className="text-gray-400 text-sm mt-1">{stockedCount} items stocked</p>
              </div>
              <button onClick={savePantry} disabled={pantrySaving}
                className="px-5 py-2.5 rounded-full font-semibold text-sm transition"
                style={{ background: pantrySaved ? '#4ade80' : '#D4AF37', color: '#0a3340' }}>
                {pantrySaving ? '⏳ Saving...' : pantrySaved ? '✓ Saved' : '💾 Save'}
              </button>
            </div>

            {!user && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm text-center"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                You're browsing as a guest. <a href="/auth/login" className="underline font-semibold">Sign in</a> to save your pantry.
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