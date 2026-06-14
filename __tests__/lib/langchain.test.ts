jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation((config: any) => ({ config, stream: jest.fn() })),
}))

import { ChatOpenAI } from '@langchain/openai'
import { createModel } from '../../lib/langchain'

describe('createModel', () => {
  it('creates a ChatOpenAI instance with streaming enabled', () => {
    const model = createModel()
    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ streaming: true, model: 'gpt-4o-mini' })
    )
    expect(model).toBeDefined()
  })

  it('passes custom temperature', () => {
    createModel(0.2)
    expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.2 }))
  })

  it('uses default temperature of 0.7', () => {
    createModel()
    expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.7 }))
  })
})
