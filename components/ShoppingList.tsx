'use client'

interface ShoppingItem {
  name: string
  category: string
  checked: boolean
}

interface ShoppingListProps {
  items: ShoppingItem[]
  onToggle: (index: number) => void
}

export default function ShoppingList({ items, onToggle }: ShoppingListProps) {
  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="font-bold text-lg mb-3" style={{ color: '#D4AF37' }}>{category}</h3>
          <div className="space-y-2">
            {items
              .map((item, index) => ({ ...item, index }))
              .filter((item) => item.category === category)
              .map((item) => (
                <div
                  key={item.index}
                  onClick={() => onToggle(item.index)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
                    style={{
                      borderColor: item.checked ? '#4ade80' : '#D4AF37',
                      background: item.checked ? '#4ade80' : 'transparent',
                    }}>
                    {item.checked && <span className="text-xs text-black font-bold">✓</span>}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      textDecoration: item.checked ? 'line-through' : 'none',
                      color: item.checked ? '#6b7280' : 'white',
                    }}>
                    {item.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
