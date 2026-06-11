'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdate = async () => {
    if (password !== confirm) {
      setMessage('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) setMessage(error.message)
    else window.location.href = '/dashboard'
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center"
      style={{background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)'}}>
      
      <div className="w-full max-w-md p-8 rounded-2xl"
        style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)'}}>
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">New Password</h1>
          <p className="text-gray-400 mt-1">Choose a new password for your account</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
            style={{background: 'rgba(255,255,255,0.1)'}}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-yellow-400"
            style={{background: 'rgba(255,255,255,0.1)'}}
          />

          {message && (
            <p className="text-sm text-center text-red-400">{message}</p>
          )}

          <button onClick={handleUpdate} disabled={loading || !password || !confirm}
            className="w-full py-3 rounded-xl font-bold transition disabled:opacity-50"
            style={{background: '#D4AF37', color: '#0a3340'}}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </main>
  )
}