jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../../../lib/supabase'
import { getLatestShoppingList, saveShoppingList } from '../../../lib/db/shopping'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
})

const items = [
  { name: 'Chicken Breast', category: 'Proteins', checked: false },
  { name: 'Broccoli', category: 'Vegetables', checked: false },
]

describe('getLatestShoppingList', () => {
  it('returns the most recent list', async () => {
    const list = { id: 'sl1', items, created_at: '2024-01-01' }
    mockBuilder.single.mockResolvedValue({ data: list, error: null })
    const { data } = await getLatestShoppingList('user-1')
    expect(data).toEqual(list)
    expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockBuilder.limit).toHaveBeenCalledWith(1)
  })
})

describe('saveShoppingList', () => {
  it('inserts list with user_id and items', async () => {
    await saveShoppingList('user-1', items)
    expect(mockBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-1', items })
  })
})
