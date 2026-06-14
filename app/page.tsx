'use client'
import { useEffect } from 'react'
import { useUser } from '../lib/UserContext'

export default function Home() {
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && user) window.location.href = '/dashboard'
  }, [user, loading])

  if (loading || user) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
      <div className="text-center px-6">
        <div className="text-7xl mb-6 animate-bounce">🐱</div>
        <h1 className="text-4xl font-bold text-white mb-2">Billo's <span style={{color:'#D4AF37'}}>Nutrition</span></h1>
        <p className="text-gray-400 mb-10">Your personal AI nutrition friend</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <a href="/auth/login"
            className="py-3 rounded-full font-semibold text-center"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            Sign In
          </a>
          <a href="/dashboard"
            className="py-3 rounded-full font-semibold text-center"
            style={{background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'}}>
            Continue as Guest
          </a>
        </div>
      </div>
    </main>
  )
}
