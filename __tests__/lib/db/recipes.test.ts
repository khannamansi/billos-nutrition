jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../../../lib/supabase'
import { getSavedRecipes, saveRecipe, deleteRecipe } from '../../../lib/db/recipes'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve)
    ),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
})

describe('getSavedRecipes', () => {
  it('fetches recipes ordered by saved_at desc', async () => {
    const recipes = [{ id: 'r1', name: 'Chicken Bowl', calories: 500, protein: 40 }]
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: recipes, error: null }).then(resolve)
    )
    const { data } = await getSavedRecipes('user-1')
    expect(data).toEqual(recipes)
    expect(mockBuilder.order).toHaveBeenCalledWith('saved_at', { ascending: false })
  })
})

describe('saveRecipe', () => {
  it('inserts recipe and returns saved row', async () => {
    const recipe = { name: 'Salad', calories: 300, protein: 20, instructions: 'Mix.', ingredients: 'greens' }
    const saved = { id: 'r2', ...recipe, saved_at: '2024-01-01' }
    mockBuilder.single.mockResolvedValue({ data: saved, error: null })
    const { data } = await saveRecipe('user-1', recipe)
    expect(data).toEqual(saved)
    expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-1', name: 'Salad' }))
  })
})

describe('deleteRecipe', () => {
  it('deletes by recipe id', async () => {
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const { error } = await deleteRecipe('r1')
    expect(error).toBeNull()
    expect(mockBuilder.delete).toHaveBeenCalled()
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'r1')
  })
})
