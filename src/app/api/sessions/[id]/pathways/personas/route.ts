import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { ensurePathwayPersonas, hasAvatar } from '@/lib/avatar'

type Ctx = { params: Promise<{ id: string }> }

export const maxDuration = 180

/** Generate avatar persona variants for each imagined future (when companion exists). */
export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const session = await db.getSession(id)
  if (!session || session.guest_id !== guestId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!(await hasAvatar(guestId))) {
    return NextResponse.json({ personas: {}, skipped: true })
  }

  const pathways = await db.listPathways(id)
  if (pathways.length === 0) {
    return NextResponse.json({ personas: {} })
  }

  try {
    const personas = await ensurePathwayPersonas(
      guestId,
      pathways.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
      })),
    )
    return NextResponse.json({ personas })
  } catch (error) {
    console.error('POST pathways/personas', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create personas' },
      { status: 500 },
    )
  }
}
