import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { generateMirror } from '@/lib/mira-engine'
import { getRequestLocale, localeFromBody } from '@/lib/i18n/server-locale'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const session = await db.getSession(id)
  if (!session || session.guest_id !== guestId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => ({}))) as { locale?: string }
  const locale = localeFromBody(body) || (await getRequestLocale())

  const messages = await db.listMessages(id)
  const userCount = messages.filter((m) => m.role === 'user').length
  if (userCount < 1) {
    return NextResponse.json(
      { error: locale === 'zh' ? '请先分享至少一段反思。' : 'Share at least one reflection first.' },
      { status: 400 },
    )
  }

  const draft = await generateMirror(id, messages, locale)
  const mirror = await db.saveMirror(draft)
  await db.updateSessionStatus(id, 'mirrored')

  return NextResponse.json({ mirror })
}
