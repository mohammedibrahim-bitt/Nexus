import Anthropic from '@anthropic-ai/sdk'
import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'

import type { AiProvider } from './aiProviders'

export type { AiProvider } from './aiProviders'

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-flash-latest'

type ToolCallParams = {
  apiKey: string
  maxTokens?: number
  prompt: string
  systemPrompt: string
  tool: { description: string; inputSchema: Record<string, unknown>; name: string }
}

async function callAnthropic<T>(params: ToolCallParams): Promise<T> {
  const anthropic = new Anthropic({ apiKey: params.apiKey })

  const response = await anthropic.messages.create({
    max_tokens: params.maxTokens ?? 4096,
    messages: [{ content: params.prompt, role: 'user' }],
    model: ANTHROPIC_MODEL,
    system: params.systemPrompt,
    tool_choice: { name: params.tool.name, type: 'tool' },
    tools: [
      {
        input_schema: params.tool.inputSchema as Anthropic.Tool['input_schema'],
        name: params.tool.name,
        description: params.tool.description,
      },
    ],
  })

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolUse) {
    throw new Error('Claude did not return a structured tool response.')
  }

  return toolUse.input as T
}

async function callOpenAI<T>(params: ToolCallParams): Promise<T> {
  const openai = new OpenAI({ apiKey: params.apiKey })

  const response = await openai.chat.completions.create({
    max_tokens: params.maxTokens ?? 4096,
    messages: [
      { content: params.systemPrompt, role: 'system' },
      { content: params.prompt, role: 'user' },
    ],
    model: OPENAI_MODEL,
    tool_choice: { function: { name: params.tool.name }, type: 'function' },
    tools: [
      {
        function: {
          description: params.tool.description,
          name: params.tool.name,
          parameters: params.tool.inputSchema,
        },
        type: 'function',
      },
    ],
  })

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== 'function') {
    throw new Error('OpenAI did not return a structured tool response.')
  }

  return JSON.parse(toolCall.function.arguments) as T
}

async function callGoogle<T>(params: ToolCallParams): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey })

  const response = await ai.models.generateContent({
    config: {
      maxOutputTokens: params.maxTokens ?? 4096,
      systemInstruction: params.systemPrompt,
      toolConfig: {
        functionCallingConfig: {
          allowedFunctionNames: [params.tool.name],
          mode: FunctionCallingConfigMode.ANY,
        },
      },
      tools: [
        {
          functionDeclarations: [
            {
              description: params.tool.description,
              name: params.tool.name,
              parametersJsonSchema: params.tool.inputSchema,
            },
          ],
        },
      ],
    },
    contents: params.prompt,
    model: GOOGLE_MODEL,
  })

  const call = response.functionCalls?.[0]
  if (!call?.args) {
    throw new Error('Gemini did not return a structured tool response.')
  }

  return call.args as T
}

/**
 * Runs a single tool-forced call against whichever provider the triggering
 * user configured on their profile, and returns the parsed tool input.
 * Structured tool/function-calling is more reliable across providers than
 * asking for free-text JSON and parsing it ourselves. `apiKey` is the
 * triggering user's own personal key — this feature has no shared/site-wide
 * fallback key.
 */
export async function callWithTool<T>(
  params: ToolCallParams & { provider: AiProvider },
): Promise<T> {
  switch (params.provider) {
    case 'anthropic':
      return callAnthropic<T>(params)
    case 'google':
      return callGoogle<T>(params)
    case 'openai':
      return callOpenAI<T>(params)
  }
}
