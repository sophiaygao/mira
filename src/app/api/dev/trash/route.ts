import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { GUEST_COOKIE } from '@/lib/constants'
import { getGuestId } from '@/lib/guest'
import { deleteAvatar } from '@/lib/avatar'
import * as db from '@/lib/db'

/**
 * JSON trash can — clears stored reflection data and issues a fresh guest cookie
 * so the next visit behaves like a new user.
 */
export async function POST() {
  try {
    const guestId = await getGuestId()
    if (guestId) {
      await db.clearGuestData(guestId)
      await deleteAvatar(guestId)
    } else {
      // No cookie yet — still wipe local JSON if present.
      await db.clearGuestData('__none__')
    }

    const nextGuest = randomUUID()
    const jar = await cookies()
    jar.set(GUEST_COOKIE, nextGuest, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return NextResponse.json({
      ok: true,
      clearedGuestId: guestId,
      newGuestId: nextGuest,
    })
  } catch (error) {
    console.error('POST /api/dev/trash', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not clear data' },
      { status: 500 },
    )
  }
}
