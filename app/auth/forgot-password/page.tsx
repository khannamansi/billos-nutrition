'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) return
    setLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) setMessage(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center"
      style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <div className="w-full max-w-md p-8 rounded-2xl"
        style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-400 mt-1">Enter your email and Billo will send a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-green-400 font-semibold mb-2">Reset link sent!</p>
            <p className="text-gray-400 text-sm mb-6">Check your email and click the link to reset your password.</p>
            <a href="/auth/login" className="text-sm font-semibold" style={{color: '#D4AF37'}}>
              ← Back to Login
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
              style={{background: 'rgba(255,255,255,0.1)'}}
            />

            {message && (
              <p className="text-sm text-center text-red-400">{message}</p>
            )}

            <button onClick={handleReset} disabled={loading || !email.trim()}
              className="w-full py-3 rounded-xl font-bold transition disabled:opacity-50"
              style={{background: '#D4AF37', color: '#0a3340'}}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <a href="/auth/login" className="block text-center text-gray-400 text-sm hover:text-white transition">
              ← Back to Login
            </a>
          </div>
        )}
      </div>
    </main>
  )
}