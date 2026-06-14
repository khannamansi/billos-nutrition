jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn().mockReturnValue({ auth: {}, from: jest.fn() }),
  createServerClient: jest.fn(),
}))

import { createBrowserClient } from '@supabase/ssr'
import { supabase } from '../../lib/supabase'

describe('supabase client', () => {
  it('is defined', () => {
    expect(supabase).toBeDefined()
  })

  it('is created via createBrowserClient', () => {
    expect(createBrowserClient).toHaveBeenCalled()
  })
})
