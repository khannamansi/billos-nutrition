import { ChatOpenAI } from '@langchain/openai'

export type TaskType = 'text' | 'vision'

const TASK_DEFAULTS: Record<TaskType, { model: string; temperature: number; streaming: boolean }> = {
  text:   { model: 'gpt-4o-mini', temperature: 0.7, streaming: true },
  vision: { model: 'gpt-4o',      temperature: 0.2, streaming: false },
}

export function getModel(task: TaskType): ChatOpenAI {
  const defaults = TASK_DEFAULTS[task]
  const model =
    task === 'text'
      ? (process.env.TEXT_MODEL ?? defaults.model)
      : (process.env.VISION_MODEL ?? defaults.model)

  return new ChatOpenAI({
    model,
    temperature: defaults.temperature,
    streaming: defaults.streaming,
    apiKey: process.env.OPENAI_API_KEY,
  })
}
