/** @jest-environment node */

jest.mock('@langchain/openai', () => ({ ChatOpenAI: jest.fn() }))

import { getModel } from '../../lib/ai'
import { ChatOpenAI } from '@langchain/openai'

const MockChatOpenAI = ChatOpenAI as unknown as jest.Mock

beforeEach(() => {
  MockChatOpenAI.mockClear()
  delete process.env.TEXT_MODEL
  delete process.env.VISION_MODEL
})

describe('getModel — text', () => {
  it('uses gpt-4o-mini by default', () => {
    getModel('text')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o-mini' }))
  })

  it('enables streaming', () => {
    getModel('text')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ streaming: true }))
  })

  it('uses temperature 0.7 for varied output', () => {
    getModel('text')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.7 }))
  })

  it('respects TEXT_MODEL env override', () => {
    process.env.TEXT_MODEL = 'gpt-4o'
    getModel('text')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }))
  })
})

describe('getModel — vision', () => {
  it('uses gpt-4o by default', () => {
    getModel('vision')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4o' }))
  })

  it('disables streaming', () => {
    getModel('vision')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ streaming: false }))
  })

  it('uses temperature 0.2 for accurate identification', () => {
    getModel('vision')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.2 }))
  })

  it('respects VISION_MODEL env override', () => {
    process.env.VISION_MODEL = 'gpt-4-turbo'
    getModel('vision')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-4-turbo' }))
  })
})

describe('getModel — shared', () => {
  it('passes OPENAI_API_KEY from env', () => {
    process.env.OPENAI_API_KEY = 'test-key'
    getModel('text')
    expect(MockChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-key' }))
  })

  it('text and vision use different models by default', () => {
    getModel('text')
    getModel('vision')
    const [textCall, visionCall] = MockChatOpenAI.mock.calls
    expect(textCall[0].model).not.toBe(visionCall[0].model)
  })
})
