/** @jest-environment node */

jest.mock('../../lib/ai', () => ({
  getModel: jest.fn(),
}))

import { validateInput, validateOutput } from '../../lib/guardrails'
import { getModel } from '../../lib/ai'

const mockInvoke = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(getModel as jest.Mock).mockReturnValue({ invoke: mockInvoke })
})

describe('validateInput', () => {
  it('returns valid:true for food-related input', async () => {
    mockInvoke.mockResolvedValue({ content: 'YES' })
    const result = await validateInput('chicken breast and broccoli')
    expect(result.valid).toBe(true)
  })

  it('returns valid:false for non-food input', async () => {
    mockInvoke.mockResolvedValue({ content: 'NO' })
    const result = await validateInput('write me a python script')
    expect(result.valid).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('returns valid:false immediately for empty input without calling LLM', async () => {
    const result = await validateInput('')
    expect(result.valid).toBe(false)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('returns valid:false for whitespace-only input without calling LLM', async () => {
    const result = await validateInput('   ')
    expect(result.valid).toBe(false)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('uses the text model for classification', async () => {
    mockInvoke.mockResolvedValue({ content: 'YES' })
    await validateInput('eggs and spinach')
    expect(getModel).toHaveBeenCalledWith('text')
  })

  it('fails open when LLM throws — lets the request through', async () => {
    mockInvoke.mockRejectedValue(new Error('OpenAI timeout'))
    const result = await validateInput('chicken')
    expect(result.valid).toBe(true)
  })
})

describe('validateOutput', () => {
  const validRecipe = {
    name: 'Grilled Chicken',
    calories: 400,
    protein: 35,
    prepTime: '20 minutes',
    ingredients: 'chicken breast, olive oil',
    instructions: 'Grill for 20 minutes.',
  }

  it('returns valid:true for realistic macros', () => {
    expect(validateOutput([validRecipe]).valid).toBe(true)
  })

  it('returns valid:true for an empty recipe list', () => {
    expect(validateOutput([]).valid).toBe(true)
  })

  it('returns valid:false for impossibly high calories', () => {
    expect(validateOutput([{ ...validRecipe, calories: 50000 }]).valid).toBe(false)
  })

  it('returns valid:false for negative calories', () => {
    expect(validateOutput([{ ...validRecipe, calories: -100 }]).valid).toBe(false)
  })

  it('returns valid:false for impossibly high protein', () => {
    expect(validateOutput([{ ...validRecipe, protein: 1000 }]).valid).toBe(false)
  })

  it('returns valid:false for negative protein', () => {
    expect(validateOutput([{ ...validRecipe, protein: -5 }]).valid).toBe(false)
  })

  it('includes only invalid recipes in the invalid array', () => {
    const badRecipe = { ...validRecipe, calories: 99999 }
    const result = validateOutput([validRecipe, badRecipe])
    expect(result.valid).toBe(false)
    expect(result.invalid).toContainEqual(badRecipe)
    expect(result.invalid).not.toContainEqual(validRecipe)
  })

  it('accepts calories at the minimum boundary (50)', () => {
    expect(validateOutput([{ ...validRecipe, calories: 50 }]).valid).toBe(true)
  })

  it('rejects calories below the minimum boundary (49)', () => {
    expect(validateOutput([{ ...validRecipe, calories: 49 }]).valid).toBe(false)
  })

  it('accepts protein at zero (valid for pure carb/fat dish)', () => {
    expect(validateOutput([{ ...validRecipe, protein: 0 }]).valid).toBe(true)
  })
})
