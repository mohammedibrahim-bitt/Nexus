export type AiProvider = 'anthropic' | 'google' | 'openai'

export const AI_PROVIDER_OPTIONS: { label: string; value: AiProvider }[] = [
  { label: 'Anthropic (Claude)', value: 'anthropic' },
  { label: 'OpenAI (GPT)', value: 'openai' },
  { label: 'Google (Gemini)', value: 'google' },
]
