'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Onboarding() {
  const [calories, setCalories] = useState(1400)
  const [protein, setProtein] = useState(120)
  const [restrictions, setRestrictions] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      
      const { data } = await supabase
        .from('diet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setCalories(data.daily_calories)
        setProtein(data.daily_protein)
        setRestrictions(data.restrictions)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('diet_profiles')
      .upsert({
        user_id: user.id,
        daily_calories: calories,
        daily_protein: protein,
        restrictions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) setMessage('Error saving — ' + error.message)
    else {
      setMessage('Goals saved!')
      setTimeout(() => window.location.href = '/dashboard', 1000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center"
      style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <div className="w-full max-w-lg p-8 rounded-2xl"
        style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-white">Set Your Diet Goals</h1>
          <p className="text-gray-400 mt-1">Billo will use these to personalize your recipes</p>
        </div>

        <div className="space-y-6">
          {/* Calories */}
          <div>
            <label className="text-white font-semibold block mb-2">
              🔥 Daily Calories: <span style={{color: '#D4AF37'}}>{calories} kcal</span>
            </label>
            <input type="range" min="1000" max="3000" step="50"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-gray-400 text-xs mt-1">
              <span>1000</span><span>2000</span><span>3000</span>
            </div>
          </div>

          {/* Protein */}
          <div>
            <label className="text-white font-semibold block mb-2">
              💪 Daily Protein: <span style={{color: '#D4AF37'}}>{protein}g</span>
            </label>
            <input type="range" min="50" max="250" step="5"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-gray-400 text-xs mt-1">
              <span>50g</span><span>150g</span><span>250g</span>
            </div>
          </div>

          {/* Restrictions */}
          <div>
            <label className="text-white font-semibold block mb-2">
              🚫 Dietary Restrictions
            </label>
            <input
              type="text"
              placeholder="e.g. no beef, vegetarian, gluten free"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
              style={{background: 'rgba(255,255,255,0.1)'}}
            />
          </div>

          {message && (
            <p className="text-center text-sm font-semibold"
              style={{color: message.includes('Error') ? '#f87171' : '#4ade80'}}>
              {message}
            </p>
          )}

          <button onClick={handleSave} disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg transition"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            {loading ? 'Saving...' : 'Save My Goals 🎯'}
          </button>

          <a href="/dashboard" className="block text-center text-gray-400 text-sm hover:text-white transition">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}