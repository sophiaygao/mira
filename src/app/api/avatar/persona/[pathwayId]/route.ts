import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import { readPersona } from '@/lib/avatar'

type Ctx = { params: Promise<{ pathwayId: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { pathwayId } = await ctx.params
    const guestId = await getOrCreateGuestId()
    const buf = await readPersona(guestId, pathwayId)
    if (!buf) {
      return NextResponse.json({ exists: false }, { status: 404 })
    }
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=120',
      },
    })
  } catch (error) {
    console.error('GET /api/avatar/persona', error)
    return NextResponse.json({ error: 'Could not load persona' }, { status: 500 })
  }
}

export async function HEAD(_req: Request, ctx: Ctx) {
  const { pathwayId } = await ctx.params
  const guestId = await getOrCreateGuestId()
  const buf = await readPersona(guestId, pathwayId)
  return new NextResponse(null, { status: buf ? 200 : 404 })
}
