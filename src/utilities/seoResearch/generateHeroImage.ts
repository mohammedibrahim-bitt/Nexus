import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'

import type { AiProvider } from './aiClient'

/**
 * Best-effort hero image generation using the same provider/key already
 * configured for the run — no separate image API/key required. Anthropic
 * has no image generation API, so this simply returns null for it (the post
 * falls back to the site's existing dynamic OG-image-as-placeholder
 * behavior). Any failure here must never fail the overall research run.
 */
export async function generateHeroImage(
  prompt: string,
  apiKey: string,
  provider: AiProvider,
): Promise<Buffer | null> {
  try {
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey })
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        response_format: 'b64_json',
        size: '1792x1024',
      })
      const b64 = res.data?.[0]?.b64_json
      return b64 ? Buffer.from(b64, 'base64') : null
    }

    if (provider === 'google') {
      const ai = new GoogleGenAI({ apiKey })
      const res = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
      })
      const b64 = res.generatedImages?.[0]?.image?.imageBytes
      return b64 ? Buffer.from(b64, 'base64') : null
    }

    return null
  } catch {
    return null
  }
}
