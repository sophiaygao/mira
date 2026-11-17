import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

/** Persist a voice transcript turn without generating a text reply. */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const guestId = await getOrCreateGuestId()
    const session = await db.getSession(id)
    if (!session || session.guest_id !== guestId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = (await req.json()) as {
      role?: 'user' | 'mira'
      content?: string
      prompt_key?: string
    }

    const role = body.role
    const content = body.content?.trim()
    if (!role || !content || (role !== 'user' && role !== 'mira')) {
      return NextResponse.json({ error: 'role and content required' }, { status: 400 })
    }

    const message = await db.addMessage({
      session_id: id,
      role,
      content,
      prompt_key: body.prompt_key,
    })

    if (role === 'user') {
      const messages = await db.listMessages(id)
      const userCount = messages.filter((m) => m.role === 'user').length
      if (userCount === 1) {
        const title = content.length > 48 ? `${content.slice(0, 48)}…` : content
        await db.updateSessionTitle(id, title)
      }
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('POST /api/sessions/[id]/transcript', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save transcript' },
      { status: 500 },
    )
  }
}
