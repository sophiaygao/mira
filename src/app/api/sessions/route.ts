import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { getRequestLocale, localeFromBody } from '@/lib/i18n/server-locale'
import { pickOpeningPrompt } from '@/lib/openings'

export async function GET() {
  try {
    const guestId = await getOrCreateGuestId()
    const sessions = await db.listSessions(guestId)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('GET /api/sessions', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list sessions' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const guestId = await getOrCreateGuestId()
    const body = (await req.json().catch(() => ({}))) as { title?: string; locale?: string }
    const locale = localeFromBody(body) || (await getRequestLocale())
    const session = await db.createSession(
      guestId,
      body.title || (locale === 'zh' ? '反思' : 'Reflection'),
    )

    const welcome = await db.addMessage({
      session_id: session.id,
      role: 'mira',
      content: pickOpeningPrompt(locale),
    })

    return NextResponse.json({ session, messages: [welcome] })
  } catch (error) {
    console.error('POST /api/sessions', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 },
    )
  }
}
