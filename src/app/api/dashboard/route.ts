import { NextResponse } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'

export async function GET() {
  const guestId = await getOrCreateGuestId()
  const data = await db.getDashboard(guestId)
  return NextResponse.json(data)
}
