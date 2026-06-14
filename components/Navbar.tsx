'use client'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'

interface NavbarProps {
  active?: 'recipes' | 'shopping' | 'saved' | 'history' | 'dashboard' | 'pantry' | 'meal-prep' | 'tracker'
}

export default function Navbar({ active }: NavbarProps) {
  const { user } = useUser()

  const links = [
    // { href: '/pantry', label: 'Pantry', key: 'pantry' },
    // { href: '/meal-prep', label: 'Meal Prep', key: 'meal-prep' },
    // { href: '/tracker', label: 'Tracker', key: 'tracker' },
    { href: '/recipes', label: 'Recipes', key: 'recipes' },
    { href: '/shopping', label: 'Shopping', key: 'shopping' },
    { href: '/saved', label: 'Saved', key: 'saved' },
    { href: '/history', label: 'History', key: 'history' },
  ]

  return (
    <nav className="flex justify-between items-center px-8 py-5 border-b border-white/10">
      <a href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
        <span className="text-2xl">🐱</span>
        <span className="text-white font-bold text-lg">Billo's <span style={{color: '#D4AF37'}}>Nutrition</span></span>
      </a>
      <div className="flex items-center gap-6">
        {links.map(link => (
          <a key={link.key} href={link.href}
            className="text-sm transition font-medium"
            style={{ color: active === link.key ? '#D4AF37' : '#ffffff' }}>
            {link.label}
          </a>
        ))}
        {user ? (
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            Sign Out
          </button>
        ) : (
          <a href="/auth/login"
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            Sign In
          </a>
        )}
      </div>
    </nav>
  )
}
