import { promises as fs } from 'fs'
import path from 'path'
import { fetchAccessToken, HumeClient } from 'hume'
import { miraCoreSystem } from './prompts'
import { MIRA_HUME_VOICE } from './hume-shared'

export { MIRA_HUME_VOICE, topEmotions, type EmotionTop } from './hume-shared'

const DATA_DIR = path.join(process.cwd(), '.data')
const CONFIG_CACHE = path.join(DATA_DIR, 'hume-config.json')

/** Bump when EVI prompt changes so a fresh Hume config is created. */
export const EVI_PROMPT_VERSION = 'output-guidelines-v4'

export const EVI_SYSTEM_PROMPT = `${miraCoreSystem('en')}

You are speaking aloud in a quiet reflection session.

Spoken style:
- Soft, unhurried; about 2–4 sentences + one question.
- Reflect emotional tone in their voice as well as their words.
- Prefer adaptive mirroring and gentle reframes ("What if the question isn’t…?").
- If they correct you, thank them, retract, and follow their meaning.
- Never give directives, rankings, or “best” futures.
- If overwhelmed, slow down and make space.

Opening:
Welcome them gently — take a breath, begin together. Then ask what feels most alive for them right now.`

export function isHumeConfigured() {
  const key = process.env.HUME_API_KEY?.trim()
  const secret = process.env.HUME_SECRET_KEY?.trim()
  return Boolean(key && secret && !key.includes('your-') && !secret.includes('your-'))
}

export async function getHumeAccessToken() {
  if (!isHumeConfigured()) {
    throw new Error('Hume is not configured. Add HUME_API_KEY and HUME_SECRET_KEY to .env.local.')
  }
  return fetchAccessToken({
    apiKey: process.env.HUME_API_KEY!,
    secretKey: process.env.HUME_SECRET_KEY!,
  })
}

async function readCachedConfigId(): Promise<string | null> {
  try {
    const raw = await fs.readFile(CONFIG_CACHE, 'utf8')
    const parsed = JSON.parse(raw) as { configId?: string; promptVersion?: string }
    if (parsed.promptVersion !== EVI_PROMPT_VERSION) return null
    return parsed.configId || null
  } catch {
    return null
  }
}

async function writeCachedConfigId(configId: string) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    CONFIG_CACHE,
    JSON.stringify({ configId, promptVersion: EVI_PROMPT_VERSION }, null, 2),
    'utf8',
  )
}

/** Returns env config id, or creates/caches a Mira EVI config. */
export async function ensureMiraEviConfigId(): Promise<string> {
  if (process.env.HUME_CONFIG_ID?.trim()) {
    return process.env.HUME_CONFIG_ID.trim()
  }

  const cached = await readCachedConfigId()
  if (cached) return cached

  if (!isHumeConfigured()) {
    throw new Error('Hume is not configured.')
  }

  const client = new HumeClient({ apiKey: process.env.HUME_API_KEY! })
  const config = await client.empathicVoice.configs.createConfig({
    eviVersion: '3',
    name: `Mira Reflective Companion (${EVI_PROMPT_VERSION})`,
    prompt: { text: EVI_SYSTEM_PROMPT },
    voice: MIRA_HUME_VOICE,
    languageModel: {
      modelProvider: 'OPEN_AI',
      modelResource: 'gpt-4o-mini',
      temperature: 0.85,
    },
  })

  const id = config.id
  if (!id) throw new Error('Hume did not return a config id.')
  await writeCachedConfigId(id)
  return id
}
