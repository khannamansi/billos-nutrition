export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐘</span>
          <span className="text-white font-bold text-xl">Billo's Nutrition</span>
        </div>
        <button className="px-6 py-2 rounded-full font-semibold text-sm"
          style={{ background: '#D4AF37', color: '#0a3340' }}>
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-8 pt-20 pb-16">
        <div className="text-7xl mb-6">🐘</div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Your Personal<br />
          <span style={{ color: '#D4AF37' }}>AI Nutrition</span> Friend
        </h1>
        <p className="text-xl text-gray-300 max-w-lg mb-10">
          Tell Billo what's in your fridge and your goals — get personalized recipes,
          smart shopping lists, and meal plans. Like having a nutritionist friend on speed dial.
        </p>
        <div className="flex gap-4">
          <button className="px-8 py-4 rounded-full font-bold text-lg"
            style={{ background: '#D4AF37', color: '#0a3340' }}>
            Start Cooking 🍳
          </button>
          <button className="px-8 py-4 rounded-full font-bold text-lg border-2 text-white"
            style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
            See How It Works
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20 max-w-5xl mx-auto">
        {[
          { emoji: '🍳', title: 'Smart Recipes', desc: 'Get personalized recipes based on what you already have in your fridge' },
          { emoji: '🛒', title: 'Shopping Lists', desc: 'Auto-generated weekly staples tailored to your calorie and protein goals' },
          { emoji: '📊', title: 'Track Goals', desc: 'Set your calorie and protein targets and get meals that hit your numbers' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div className="text-4xl mb-3">{f.emoji}</div>
            <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-gray-500 text-sm">Made with 💛 by Billo's Nutrition</p>
      </div>

    </main>
  )
}