'use client'
import { useEffect, useState, useMemo } from 'react'
import { useUser } from '../../lib/UserContext'
import { PANTRY_CATEGORIES } from '../../lib/pantryData'
import { apiFetch } from '../../lib/api-client'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

type StockedMap = Record<string, boolean>

export default function Pantry() {
  const { user, loading: authLoading } = useUser()
  const [stocked, setStocked] = useState<StockedMap>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (user) {
      apiFetch<{ item_name: string; is_stocked: boolean }[]>('/api/pantry')
        .then((data) => {
          const map: StockedMap = {}
          data.forEach((row) => { map[row.item_name] = row.is_stocked })
          setStocked(map)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, authLoading])

  const toggle = (item: string) => {
    setStocked((prev) => ({ ...prev, [item]: !prev[item] }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({ stocked }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐱</div>
          <p className="text-white text-lg">Loading your pantry...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <Navbar active="pantry" />
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-3xl font-bold text-white">My Pantry</h1>
            <p className="text-gray-400 text-sm mt-1">{stockedCount} items stocked</p>
          </div>
          {user ? (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition"
              style={{ background: saved ? '#4ade80' : '#D4AF37', color: '#0a3340' }}>
              {saving ? '⏳ Saving...' : saved ? '✓ Saved' : '💾 Save'}
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">Guest — data not saved</span>
          )}
        </div>
        {error && (
          <div className="mt-3 mb-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}
        <div className="relative mt-4 mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Search ingredients..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-white placeholder-gray-400 outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>
        {!user && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            You're browsing as a guest. <a href="/auth/login" className="underline font-semibold">Sign in</a> to save your pantry.
          </div>
        )}
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
                      <button key={item} onClick={() => toggle(item)}
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
      </div>
      <Footer />
    </main>
  )
}
