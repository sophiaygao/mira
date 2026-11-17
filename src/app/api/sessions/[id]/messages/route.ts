import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { generateReflectionReply } from '@/lib/mira-engine'
import { getRequestLocale, localeFromBody } from '@/lib/i18n/server-locale'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const session = await db.getSession(id)
  if (!session || session.guest_id !== guestId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json()) as { content?: string; locale?: string }
  const locale = localeFromBody(body) || (await getRequestLocale())
  const content = body.content?.trim()
  if (!content) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const userMsg = await db.addMessage({
    session_id: id,
    role: 'user',
    content,
  })

  const prior = await db.listMessages(id)
  const userCount = prior.filter((m) => m.role === 'user').length
  if (userCount === 1) {
    const title = content.length > 48 ? `${content.slice(0, 48)}…` : content
    await db.updateSessionTitle(id, title)
  }

  const reply = await generateReflectionReply(prior, locale)
  const miraMsg = await db.addMessage({
    session_id: id,
    role: 'mira',
    content: reply.content,
    prompt_key: reply.prompt_key,
  })

  return NextResponse.json({ user: userMsg, mira: miraMsg })
}
