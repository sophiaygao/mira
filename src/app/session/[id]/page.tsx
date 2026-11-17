import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { getRequestLocale } from '@/lib/i18n/server-locale'
import { SessionWorkspace } from '@/components/SessionWorkspace'

export const instant = false

type Props = { params: Promise<{ id: string }> }

async function SessionBody({ params }: Props) {
  await connection()
  const { id } = await params
  const guestId = await getOrCreateGuestId()
  const detail = await db.getSessionDetail(id)

  if (!detail) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-2xl text-sage-deep">This reflection couldn’t be found.</p>
        <p className="mt-3 text-sm text-ink-soft">
          It may have been cleared, or we’re looking in a different quiet space.
        </p>
        <Link
          href="/reflect?locale=en"
          className="mt-8 rounded-xl bg-sage-deep px-5 py-2.5 text-sm text-[#f4faf7] transition hover:bg-sage"
        >
          Begin a new reflection
        </Link>
      </div>
    )
  }

  if (detail.guest_id !== guestId) {
    // Stale cookie / identity mismatch — start fresh instead of a hard 404
    const locale = await getRequestLocale()
    redirect(`/reflect?locale=${locale}`)
  }

  const { messages, mirror, pathways, ...session } = detail

  return (
    <SessionWorkspace
      session={session}
      initialMessages={messages}
      initialMirror={mirror}
      initialPathways={pathways}
    />
  )
}

export default function SessionPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-24 text-ink-soft">
          Opening session…
        </div>
      }
    >
      <SessionBody params={props.params} />
    </Suspense>
  )
}
