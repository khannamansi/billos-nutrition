'use client'

interface MealEntry {
  id: string
  meal_name: string
  calories: number
  protein: number
  logged_at: string
}

interface MealHistoryCardProps {
  meal: MealEntry
  onDelete: (id: string) => void
}

export default function MealHistoryCard({ meal, onDelete }: MealHistoryCardProps) {
  const date = new Date(meal.logged_at)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })

  return (
    <div className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">{meal.meal_name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{dateStr} · {timeStr}</p>
      </div>
      <div className="flex items-center gap-4 ml-4 shrink-0">
        <div className="text-right">
          <p className="text-yellow-400 text-sm font-semibold">{meal.calories} kcal</p>
          <p className="text-green-400 text-xs">{meal.protein}g protein</p>
        </div>
        <button
          onClick={() => onDelete(meal.id)}
          aria-label="Delete meal"
          className="text-gray-500 hover:text-red-400 transition text-lg leading-none">
          ✕
        </button>
      </div>
    </div>
  )
}
