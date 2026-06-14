jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../../../lib/supabase'
import { getMealHistory, logMeal, deleteMeal } from '../../../lib/db/meals'

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

describe('getMealHistory', () => {
  it('returns meals ordered by logged_at desc', async () => {
    const meals = [{ id: 'm1', meal_name: 'Oatmeal', calories: 300, protein: 10 }]
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: meals, error: null }).then(resolve)
    )
    const { data } = await getMealHistory('user-1')
    expect(data).toEqual(meals)
    expect(mockBuilder.order).toHaveBeenCalledWith('logged_at', { ascending: false })
  })
})

describe('logMeal', () => {
  it('inserts meal and returns the new row', async () => {
    const meal = { meal_name: 'Eggs', calories: 200, protein: 14 }
    const inserted = { id: 'm2', ...meal, logged_at: '2024-01-01' }
    mockBuilder.single.mockResolvedValue({ data: inserted, error: null })
    const { data } = await logMeal('user-1', meal)
    expect(data).toEqual(inserted)
    expect(mockBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-1', ...meal }))
  })
})

describe('deleteMeal', () => {
  it('deletes by meal id', async () => {
    mockBuilder.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const { error } = await deleteMeal('m1')
    expect(error).toBeNull()
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'm1')
  })
})
