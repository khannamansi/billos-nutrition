'use client'

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: '#D4AF37', color: '#0a3340' }}>BN</div>
          <span className="text-white font-bold text-xl">Billo's Nutrition</span>
        </div>
        <a href="/auth/login"
          className="px-6 py-2 rounded-full font-semibold text-sm"
          style={{ background: '#D4AF37', color: '#0a3340' }}>
          Get Started
        </a>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-8 pt-16 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
          ✨ AI Powered Nutrition Assistant
        </div>
        <div className="text-8xl mb-6">🐱</div>
        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
          Your Personal<br />
          <span style={{ color: '#D4AF37' }}>AI Nutrition</span> Friend
        </h1>
        <p className="text-xl text-gray-300 max-w-lg mb-10">
          Tell Billo what's in your fridge and your goals — get personalized recipes,
          smart shopping lists, and meal plans. Like having a nutritionist friend on speed dial.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <a href="/auth/login"
            className="px-8 py-4 rounded-full font-bold text-lg transition hover:opacity-90"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            Start Cooking 🍳
          </a>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-bold text-lg border-2 transition hover:bg-white/10"
            style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
            See How It Works
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-12 px-8 pb-20 flex-wrap">
        {[
          { value: 'AI', label: 'Powered Recipes' },
          { value: '∞', label: 'Recipe Combinations' },
          { value: '100%', label: 'Personalized' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl font-bold mb-1" style={{ color: '#D4AF37' }}>{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-gray-400 text-center mb-16">Three simple steps to better eating</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              emoji: '🎯',
              title: 'Set Your Goals',
              desc: 'Tell Billo your daily calorie and protein targets, plus any dietary restrictions. Takes 30 seconds.'
            },
            {
              step: '02',
              emoji: '🥦',
              title: 'Add Your Ingredients',
              desc: 'Type what you have in your fridge. Billo figures out what you can make with what you already have.'
            },
            {
              step: '03',
              emoji: '✨',
              title: 'Get Personalized Recipes',
              desc: 'Instantly receive recipes tailored to your goals, ingredients, and restrictions. Save your favorites.'
            },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl p-8"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="text-6xl font-bold mb-4 opacity-20" style={{ color: '#D4AF37' }}>{item.step}</div>
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-4">Everything You Need</h2>
        <p className="text-gray-400 text-center mb-16">All your nutrition tools in one place</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              emoji: '🍳',
              title: 'AI Recipe Generator',
              desc: 'Input your fridge ingredients and get 3 personalized recipes instantly. Each recipe includes calories, protein, prep time and step by step instructions.',
              color: '#D4AF37'
            },
            {
              emoji: '🛒',
              title: 'Smart Shopping Lists',
              desc: 'Get a weekly shopping list of staples automatically tailored to your calorie and protein goals. Check items off as you shop.',
              color: '#4ade80'
            },
            {
              emoji: '❤️',
              title: 'Save Favorites',
              desc: 'Found a recipe you love? Save it to your personal collection and access it anytime. Your recipes, your way.',
              color: '#f87171'
            },
            {
              emoji: '📊',
              title: 'Meal History & Tracking',
              desc: 'Log every meal and track your daily calories and protein. See your totals at a glance and stay on top of your goals.',
              color: '#60a5fa'
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-6 flex gap-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${f.color}30` }}>
              <div className="text-4xl flex-shrink-0">{f.emoji}</div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto rounded-2xl p-12"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <h2 className="text-4xl font-bold text-white mb-4">Ready to eat better?</h2>
          <p className="text-gray-400 mb-8">Join Billo's Nutrition and start cooking smarter today.</p>
          <a href="/auth/login"
            className="inline-block px-10 py-4 rounded-full font-bold text-lg transition hover:opacity-90"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            Get Started Free


          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
            style={{ background: '#D4AF37', color: '#0a3340' }}>BN</div>
          <span className="text-white font-semibold">Billo's Nutrition</span>
        </div>
        <p className="text-gray-500 text-sm">Made with 💛 — Your AI nutrition friend</p>
      </div>

    </main>
  )
}