import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { generateMirror, generatePathways } from '@/lib/mira-engine'
import { fallbackMirror } from '@/lib/fallbacks'
import { getRequestLocale, localeFromBody } from '@/lib/i18n/server-locale'
import type { MirrorInsight, Pathway } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

type PathwaysResult = { mirror: MirrorInsight; pathways: Pathway[] }

/** Dedupe concurrent Imagine-futures requests for the same session. */
const inflight = new Map<string, Promise<PathwaysResult>>()

async function buildPathways(id: string, locale: Awaited<ReturnType<typeof getRequestLocale>>) {
  const existing = await db.listPathways(id)
  if (existing.length > 0) {
    let mirror = await db.getMirror(id)
    if (!mirror) {
      const messages = await db.listMessages(id)
      const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content)
      mirror = await db.saveMirror(fallbackMirror(id, userTexts, locale))
    }
    return { mirror, pathways: existing }
  }

  const messages = await db.listMessages(id)
  const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content)
  let mirror = await db.getMirror(id)

  // Don't block pathways on a mirror LLM call — use a quick local mirror in parallel.
  const quickMirror = mirror ?? fallbackMirror(id, userTexts, locale)

  const mirrorPromise = mirror
    ? Promise.resolve(mirror)
    : generateMirror(id, messages, locale).then(async (draft) => {
        const saved = await db.saveMirror(draft)
        await db.updateSessionStatus(id, 'mirrored')
        return saved
      })

  const [savedMirror, drafts] = await Promise.all([
    mirrorPromise,
    generatePathways(id, messages, quickMirror, locale),
  ])

  const pathways = await db.savePathways(id, drafts)
  await db.updateSessionStatus(id, 'complete')
  return { mirror: savedMirror, pathways }
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const session = await db.getSession(id)
  if (!session || session.guest_id !== guestId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => ({}))) as { locale?: string }
  const locale = localeFromBody(body) || (await getRequestLocale())

  try {
    let pending = inflight.get(id)
    if (!pending) {
      pending = buildPathways(id, locale).finally(() => {
        inflight.delete(id)
      })
      inflight.set(id, pending)
    }

    const result = await pending
    if (!result.mirror && result.pathways.length === 0) {
      return NextResponse.json({ error: 'Could not imagine futures' }, { status: 500 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('POST pathways', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not imagine futures' },
      { status: 500 },
    )
  }
}
