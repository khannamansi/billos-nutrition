'use client'

interface Recipe {
  name: string
  calories: number
  protein: number
  prepTime: string
  ingredients: string
  instructions: string
}

interface RecipeCardProps {
  recipe: Recipe
  onSave?: (recipe: Recipe) => void
  saving?: boolean
  saved?: boolean
}

export default function RecipeCard({ recipe, onSave, saving, saved }: RecipeCardProps) {
  return (
    <div className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-white font-bold text-xl">{recipe.name}</h3>
        {onSave && (
          <button
            onClick={() => onSave(recipe)}
            disabled={saving || saved}
            className="px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-60"
            style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid #D4AF37' }}>
            {saving ? 'Saving...' : saved ? '✅ Saved' : '❤️ Save'}
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}>
          🔥 {recipe.calories} kcal
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>
          💪 {recipe.protein}g protein
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }}>
          ⏱️ {recipe.prepTime}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-400 text-sm font-semibold mb-1">Ingredients:</p>
        <p className="text-gray-300 text-sm">{recipe.ingredients}</p>
      </div>

      <div>
        <p className="text-gray-400 text-sm font-semibold mb-1">Instructions:</p>
        <p className="text-gray-300 text-sm leading-relaxed">{recipe.instructions}</p>
      </div>
    </div>
  )
}
