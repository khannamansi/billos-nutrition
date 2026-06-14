jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../../../lib/supabase'
import { getProfile, upsertProfile } from '../../../lib/db/profile'

let mockBuilder: any

beforeEach(() => {
  jest.clearAllMocks()
  mockBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }
  ;(supabase.from as jest.Mock).mockReturnValue(mockBuilder)
})

describe('getProfile', () => {
  it('returns profile data for a user', async () => {
    const profile = { daily_calories: 2000, daily_protein: 150, restrictions: '' }
    mockBuilder.single.mockResolvedValue({ data: profile, error: null })
    const { data } = await getProfile('user-1')
    expect(data).toEqual(profile)
    expect(supabase.from).toHaveBeenCalledWith('diet_profiles')
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns null when no profile exists', async () => {
    mockBuilder.single.mockResolvedValue({ data: null, error: { message: 'No rows' } })
    const { data, error } = await getProfile('user-1')
    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })
})

describe('upsertProfile', () => {
  it('upserts with correct payload', async () => {
    const profile = { daily_calories: 1800, daily_protein: 130, restrictions: 'vegan' }
    await upsertProfile('user-1', profile)
    expect(supabase.from).toHaveBeenCalledWith('diet_profiles')
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', ...profile }),
      { onConflict: 'user_id' }
    )
  })

  it('returns error on failure', async () => {
    mockBuilder.upsert.mockResolvedValue({ error: { message: 'DB error' } })
    const { error } = await upsertProfile('user-1', { daily_calories: 0, daily_protein: 0, restrictions: '' })
    expect(error).toBeTruthy()
  })
})
