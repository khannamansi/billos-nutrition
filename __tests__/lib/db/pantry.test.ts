jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../../../lib/supabase'
import { getPantryItems, savePantryItems } from '../../../lib/db/pantry'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
})

const pantryItems = [
  { item_name: 'Chicken Breast', category: 'Proteins', is_stocked: true },
  { item_name: 'Broccoli', category: 'Vegetables', is_stocked: false },
]

describe('getPantryItems', () => {
  it('returns pantry items for a user', async () => {
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: pantryItems, error: null }).then(resolve)
    )
    const { data } = await getPantryItems('user-1')
    expect(data).toEqual(pantryItems)
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })
})

describe('savePantryItems', () => {
  it('upserts items with user_id and updated_at', async () => {
    await savePantryItems('user-1', pantryItems)
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'user-1', item_name: 'Chicken Breast', is_stocked: true }),
      ]),
      { onConflict: 'user_id,item_name' }
    )
  })
})
