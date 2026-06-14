jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({ auth: {}, from: jest.fn() }),
}))

import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('is created via createClient', () => {
    expect(createClient).toHaveBeenCalled()
  })
})
