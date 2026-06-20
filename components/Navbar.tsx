'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useUser } from '../lib/UserContext'

interface NavbarProps {
  active?: 'recipes' | 'shopping' | 'saved' | 'history' | 'dashboard' | 'pantry' | 'meal-prep' | 'tracker'
}

export default function Navbar({ active }: NavbarProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/recipes', label: 'Recipes', key: 'recipes' },
    { href: '/shopping', label: 'Shopping', key: 'shopping' },
    { href: '/saved', label: 'Saved', key: 'saved' },
    { href: '/history', label: 'History', key: 'history' },
  ]

  return (
    <nav className="border-b border-white/10">
      <div className="flex justify-between items-center px-4 py-4 md:px-8 md:py-5">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="text-2xl">🐱</span>
          <span className="text-white font-bold text-lg">Billo's <span style={{ color: '#D4AF37' }}>Nutrition</span></span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <Link key={link.key} href={link.href}
              className="text-sm transition font-medium"
              style={{ color: active === link.key ? '#D4AF37' : '#ffffff' }}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Sign Out
            </button>
          ) : (
            <Link href="/auth/login"
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu">
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t border-white/10 pt-4">
          {links.map(link => (
            <Link key={link.key} href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium py-2 px-3 rounded-xl transition"
              style={{
                color: active === link.key ? '#D4AF37' : '#ffffff',
                background: active === link.key ? 'rgba(212,175,55,0.1)' : 'transparent',
              }}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              className="mt-1 px-4 py-2 rounded-full text-sm font-semibold text-left"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Sign Out
            </button>
          ) : (
            <Link href="/auth/login"
              onClick={() => setOpen(false)}
              className="mt-1 px-4 py-2 rounded-full text-sm font-semibold text-center"
              style={{ background: '#D4AF37', color: '#0a3340' }}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
