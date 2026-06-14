import { PANTRY_CATEGORIES } from '../../lib/pantryData'

describe('pantryData', () => {
  it('exports PANTRY_CATEGORIES as an array', () => {
    expect(Array.isArray(PANTRY_CATEGORIES)).toBe(true)
  })

  it('has at least 4 categories', () => {
    expect(PANTRY_CATEGORIES.length).toBeGreaterThanOrEqual(4)
  })

  it('each category has required fields', () => {
    PANTRY_CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('emoji')
      expect(cat).toHaveProperty('color')
      expect(cat).toHaveProperty('items')
      expect(Array.isArray(cat.items)).toBe(true)
    })
  })

  it('each category has at least 5 items', () => {
    PANTRY_CATEGORIES.forEach(cat => {
      expect(cat.items.length).toBeGreaterThanOrEqual(5)
    })
  })

  it('contains Proteins category', () => {
    const proteins = PANTRY_CATEGORIES.find(c => c.name === 'Proteins')
    expect(proteins).toBeDefined()
  })

  it('contains Vegetables category', () => {
    const veg = PANTRY_CATEGORIES.find(c => c.name === 'Vegetables')
    expect(veg).toBeDefined()
  })

  it('Proteins category includes common items', () => {
    const proteins = PANTRY_CATEGORIES.find(c => c.name === 'Proteins')
    expect(proteins?.items).toContain('Chicken Breast')
    expect(proteins?.items).toContain('Eggs')
  })

  it('no duplicate items within a category', () => {
    PANTRY_CATEGORIES.forEach(cat => {
      const unique = new Set(cat.items)
      expect(unique.size).toBe(cat.items.length)
    })
  })

  it('all category colors are valid hex', () => {
    PANTRY_CATEGORIES.forEach(cat => {
      expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('no empty item names', () => {
    PANTRY_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        expect(item.trim().length).toBeGreaterThan(0)
      })
    })
  })
})