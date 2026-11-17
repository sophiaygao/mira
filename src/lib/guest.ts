import { cookies, headers } from 'next/headers'
import { randomUUID } from 'crypto'
import { GUEST_COOKIE } from './constants'

export { GUEST_COOKIE }

/** Read guest id from cookie or proxy-forwarded header. */
export async function getGuestId(): Promise<string | null> {
  const jar = await cookies()
  const fromCookie = jar.get(GUEST_COOKIE)?.value
  if (fromCookie) return fromCookie

  const h = await headers()
  return h.get('x-mira-guest-id')
}

/**
 * Prefer existing cookie / proxy header. In Route Handlers, create + set if missing.
 */
export async function getOrCreateGuestId(): Promise<string> {
  const existing = await getGuestId()
  if (existing) {
    // Ensure cookie is present for subsequent navigations
    const jar = await cookies()
    if (!jar.get(GUEST_COOKIE)?.value) {
      try {
        jar.set(GUEST_COOKIE, existing, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        })
      } catch {
        /* render path — proxy already set cookie */
      }
    }
    return existing
  }

  const id = randomUUID()
  try {
    const jar = await cookies()
    jar.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  } catch {
    /* Server Component render */
  }
  return id
}
