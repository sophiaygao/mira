import { NextResponse, type NextRequest } from 'next/server'
import { GUEST_COOKIE } from '@/lib/constants'

export function proxy(req: NextRequest) {
  const existing = req.cookies.get(GUEST_COOKIE)?.value
  const guestId = existing || crypto.randomUUID()

  // Forward guest id on the request so Route Handlers see it on first visit
  // (Set-Cookie alone is not visible to cookies() until the next request).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-mira-guest-id', guestId)

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  })

  if (!existing) {
    res.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
