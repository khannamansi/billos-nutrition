'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '@/components/Navbar'

interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

export default function ShoppingPage() {
  const [ingredients, setIngredients] = useState('')
  const [calories, setCalories] = useState(0)
  const [protein, setProtein] = useState(0)
  const [restrictions, setRestrictions] = useState('')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // guest — allow through

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
    }
    loadData()
  }, [])

  const generateList = async () => {
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
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('shopping_lists')
      .insert({ user_id: user.id, items })

    if (!error) {
      setMessage('Shopping list saved!')
      setTimeout(() => setMessage(''), 2000)
    }
    setSaving(false)
  }

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <Navbar active="shopping" />

      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">🛒 Shopping List</h1>
        <p className="text-gray-400 mb-8">Generate your weekly staples based on your goals</p>

        <div className="rounded-2xl p-6 mb-8"
          style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
          
          <label className="text-white font-semibold block mb-2">
            What do you already have? (optional)
          </label>
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. chicken, eggs, broccoli..."
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400 mb-4"
            style={{background: 'rgba(255,255,255,0.1)'}}
          />

          <button onClick={generateList} disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            {loading ? '🤔 Billo is building your list...' : '✨ Generate Shopping List'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl text-center font-semibold text-green-400"
            style={{background: 'rgba(74,222,128,0.1)'}}>
            ✅ {message}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400">{items.filter(i => !i.checked).length} items remaining</p>
              <button onClick={saveList} disabled={saving}
                className="px-6 py-2 rounded-full font-semibold text-sm"
                style={{background: '#D4AF37', color: '#0a3340'}}>
                {saving ? 'Saving...' : '💾 Save List'}
              </button>
            </div>

            {categories.map(category => (
              <div key={category} className="mb-6">
                <h3 className="text-white font-bold text-lg mb-3" style={{color: '#D4AF37'}}>
                  {category}
                </h3>
                <div className="space-y-2">
                  {items
                    .map((item, index) => ({ ...item, index }))
                    .filter(item => item.category === category)
                    .map((item) => (
                      <div key={item.index}
                        onClick={() => toggleItem(item.index)}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-white/10"
                        style={{background: 'rgba(255,255,255,0.05)'}}>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: item.checked ? '#4ade80' : '#D4AF37',
                            background: item.checked ? '#4ade80' : 'transparent'
                          }}>
                          {item.checked && <span className="text-xs text-black">✓</span>}
                        </div>
                        <span className="text-white text-sm"
                          style={{textDecoration: item.checked ? 'line-through' : 'none',
                            color: item.checked ? '#6b7280' : 'white'}}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  )
}