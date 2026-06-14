import { ChatOpenAI } from '@langchain/openai'

export function createModel(temperature = 0.7) {
  return new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature,
    apiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  })
}
