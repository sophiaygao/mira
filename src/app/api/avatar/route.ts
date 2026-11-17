import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import {
  deleteAvatar,
  generateCompanionAvatar,
  hasAvatar,
  readAvatar,
} from '@/lib/avatar'

/** Image edits can take well over the default serverless window. */
export const maxDuration = 180

export async function GET() {
  try {
    const guestId = await getOrCreateGuestId()
    const buf = await readAvatar(guestId)
    if (!buf) {
      return NextResponse.json({ exists: false }, { status: 404 })
    }
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    console.error('GET /api/avatar', error)
    return NextResponse.json({ error: 'Could not load avatar' }, { status: 500 })
  }
}

export async function HEAD() {
  const guestId = await getOrCreateGuestId()
  const exists = await hasAvatar(guestId)
  return new NextResponse(null, { status: exists ? 200 : 404 })
}

export async function POST(req: Request) {
  try {
    const guestId = await getOrCreateGuestId()
    const form = await req.formData()
    const file = form.get('image')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload a photo (image field).' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 })
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Keep the photo under 8MB.' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const result = await generateCompanionAvatar({
      guestId,
      image: bytes,
      filename: file.name || 'selfie.jpg',
      mimeType: file.type || 'image/jpeg',
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ ok: true, url: result.url })
  } catch (error) {
    console.error('POST /api/avatar', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create avatar' },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const guestId = await getOrCreateGuestId()
    await deleteAvatar(guestId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/avatar', error)
    return NextResponse.json({ error: 'Could not remove avatar' }, { status: 500 })
  }
}
