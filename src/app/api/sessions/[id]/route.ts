import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const detail = await db.getSessionDetail(id)
  if (!detail || detail.guest_id !== guestId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(detail)
}
