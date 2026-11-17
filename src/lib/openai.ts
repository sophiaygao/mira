import dns from 'node:dns'
import OpenAI from 'openai'

// Prefer IPv4 — some networks fail OpenAI connects over broken IPv6 / poisoned DNS.
try {
  dns.setDefaultResultOrder('ipv4first')
} catch {
  /* older Node */
}

const IMAGE_TIMEOUT_MS = 3 * 60 * 1000

export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

/**
 * Longer client timeout for image edits.
 * Keep the default global fetch — undici's fetch rejects Node's FormData
 * ("does not support file uploads with the current global FormData class").
 */
export function getOpenAIImages() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({
    apiKey: key,
    timeout: IMAGE_TIMEOUT_MS,
    maxRetries: 3,
  })
}

export async function chatJSON<T>(args: {
  system: string
  user: string
  temperature?: number
  max_tokens?: number
}): Promise<T | null> {
  const client = getOpenAI()
  if (!client) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await client.chat.completions.create({
    model,
    temperature: args.temperature ?? 0.7,
    max_tokens: args.max_tokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
  })

  const text = res.choices[0]?.message?.content
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function chatText(args: {
  system: string
  user: string
  temperature?: number
}): Promise<string | null> {
  const client = getOpenAI()
  if (!client) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await client.chat.completions.create({
    model,
    temperature: args.temperature ?? 0.9,
    max_tokens: 340,
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
  })

  return res.choices[0]?.message?.content?.trim() || null
}
