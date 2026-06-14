'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

interface DietProfile {
  daily_calories: number
  daily_protein: number
  restrictions: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<DietProfile | null>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // guest
      setUser(user)

      const { data } = await supabase
        .from('diet_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) setProfile(data)
    }
    getData()
  }, [])

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>

      <Navbar />

      <div className="px-8 py-12 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back! 🐱
        </h1>
        <p className="text-gray-400 text-lg mb-12">What are we cooking today?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { emoji: '🍳', title: 'Get Recipes', desc: 'Generate recipes from your fridge', href: '/recipes', color: '#D4AF37' },
            { emoji: '🛒', title: 'Pantry & Shopping', desc: 'Manage your pantry & build your shopping list', href: '/shopping', color: '#60a5fa' },
            { emoji: '❤️', title: 'Saved Recipes', desc: 'Your favorite recipes', href: '/saved', color: '#f87171' },
            { emoji: '📊', title: 'Meal History', desc: 'Track what you have eaten', href: '/history', color: '#60a5fa' },
          ].map((item) => (
            <a key={item.title} href={item.href}
              className="rounded-2xl p-6 cursor-pointer transition hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${item.color}40` }}>
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-xl">Your Daily Goals</h2>
            <a href="/onboarding" className="text-sm font-semibold" style={{ color: '#D4AF37' }}>Edit Goals →</a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Calories', value: profile ? `${profile.daily_calories} kcal` : '...', emoji: '🔥' },
              { label: 'Protein', value: profile ? `${profile.daily_protein}g` : '...', emoji: '💪' },
              { label: 'Restrictions', value: profile?.restrictions || 'None', emoji: '🚫' },
            ].map((goal) => (
              <div key={goal.label} className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-2xl mb-1">{goal.emoji}</div>
                <div className="text-white font-bold">{goal.value}</div>
                <div className="text-gray-400 text-xs mt-1">{goal.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}