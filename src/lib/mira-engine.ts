import { chatJSON, chatText } from './openai'
import {
  mirrorSystem,
  pathwaysSystem,
  reflectSystem,
  mirrorUserPrompt,
  pathwaysUserPrompt,
  reflectUserPrompt,
} from './prompts'
import { fallbackMirror, fallbackPathways, fallbackReflect } from './fallbacks'
import { normalizeToPillarLabels } from './pillars'
import { SEED_PROMPTS, type Message, type MirrorInsight, type Pathway } from './types'
import type { Locale } from '@/lib/i18n/translations'
import { tServer } from '@/lib/i18n/server-locale'

function coveredSeeds(messages: Message[]) {
  const text = messages.map((m) => m.content.toLowerCase()).join(' ')
  const covered: string[] = []
  for (const seed of SEED_PROMPTS) {
    if (messages.some((m) => m.prompt_key === seed.key)) covered.push(seed.key)
    else if (
      (seed.key === 'occupying' &&
        /occup|lately|recent|on my mind|占据|最近|心思/.test(text)) ||
      (seed.key === 'future' && /future|hope|want my life|someday|未来|希望/.test(text)) ||
      (seed.key === 'values' &&
        /value|matter|important to me|care about|价值|重要/.test(text)) ||
      (seed.key === 'uncertainty' &&
        /uncertain|don't know|unsure|navigat|不确定|迷茫/.test(text))
    ) {
      covered.push(seed.key)
    }
  }
  return [...new Set(covered)]
}

function seedText(locale: Locale, key: (typeof SEED_PROMPTS)[number]['key']) {
  const map = {
    occupying: 'seedOccupying',
    future: 'seedFuture',
    values: 'seedValues',
    uncertainty: 'seedUncertainty',
  } as const
  return tServer(locale, map[key])
}

export async function generateReflectionReply(
  messages: Message[],
  locale: Locale = 'en',
): Promise<{
  content: string
  prompt_key?: string
  engine: 'live' | 'fallback'
}> {
  const covered = coveredSeeds(messages)
  const remaining = SEED_PROMPTS.filter((s) => !covered.includes(s.key))
  const userTurns = messages.filter((m) => m.role === 'user').length

  const nextSeed =
    userTurns >= 1 && remaining.length
      ? remaining[Math.min(userTurns - 1, remaining.length - 1)]
      : undefined

  const live = await chatText({
    system: reflectSystem(locale),
    user: reflectUserPrompt({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      coveredSeeds: covered,
      remainingSeeds: remaining.map((s) => ({
        key: s.key,
        text: seedText(locale, s.key),
      })),
    }),
  })

  if (live) {
    return {
      content: live,
      prompt_key: nextSeed && (live.includes('?') || live.includes('？')) ? nextSeed.key : undefined,
      engine: 'live',
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  return {
    content: fallbackReflect(
      lastUser?.content || '',
      nextSeed ? seedText(locale, nextSeed.key) : undefined,
      locale,
    ),
    prompt_key: nextSeed?.key,
    engine: 'fallback',
  }
}

type MirrorJSON = {
  values?: string[]
  motivations?: string[]
  tensions?: string[]
  emotions?: string[]
  themes?: string[]
  summary_lines?: string[]
}

export async function generateMirror(
  sessionId: string,
  messages: Message[],
  locale: Locale = 'en',
): Promise<Omit<MirrorInsight, 'id' | 'created_at'>> {
  const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content)
  const live = await chatJSON<MirrorJSON>({
    system: mirrorSystem(locale),
    user: mirrorUserPrompt(userTexts),
    temperature: 0.4,
  })

  if (live) {
    const blob = userTexts.join('\n')
    return {
      session_id: sessionId,
      values: normalizeToPillarLabels(live.values || [], blob),
      motivations: live.motivations || [],
      tensions: live.tensions || [],
      emotions: live.emotions || [],
      themes: live.themes || [],
      summary_lines: live.summary_lines || [],
      raw: live,
    }
  }

  return fallbackMirror(sessionId, userTexts, locale)
}

type PathwaysJSON = {
  pathways?: {
    title?: string
    description?: string
    values?: string[]
    opportunities?: string[]
    tradeoffs?: string[]
  }[]
}

export async function generatePathways(
  sessionId: string,
  messages: Message[],
  mirror: Omit<MirrorInsight, 'id' | 'created_at'> | MirrorInsight,
  locale: Locale = 'en',
): Promise<Omit<Pathway, 'id' | 'created_at' | 'session_id'>[]> {
  // Keep the prompt lean — last few reflections are enough for futures.
  const userTexts = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .slice(-6)
    .map((t) => (t.length > 480 ? `${t.slice(0, 480)}…` : t))

  const live = await chatJSON<PathwaysJSON>({
    system: pathwaysSystem(locale),
    user: pathwaysUserPrompt({
      userTexts,
      mirror: {
        values: mirror.values,
        motivations: mirror.motivations,
        tensions: mirror.tensions,
        emotions: mirror.emotions,
        themes: mirror.themes,
        summary_lines: mirror.summary_lines.slice(0, 3),
      },
    }),
    temperature: 0.75,
    max_tokens: 900,
  })

  if (live?.pathways?.length) {
    return live.pathways.slice(0, 3).map((p, i) => ({
      title: p.title || (locale === 'zh' ? `可能 ${i + 1}` : `Possibility ${i + 1}`),
      description: p.description || '',
      values: normalizeToPillarLabels(p.values || []),
      opportunities: p.opportunities || [],
      tradeoffs: p.tradeoffs || [],
      sort_order: i,
    }))
  }

  return fallbackPathways(sessionId, mirror, locale).map(({ session_id: _s, ...rest }) => rest)
}
