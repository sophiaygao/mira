import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { getRequestLocale } from '@/lib/i18n/server-locale'
import { FuturesWorkspace } from '@/components/FuturesWorkspace'

export const instant = false

type Props = { params: Promise<{ id: string }> }

async function FuturesBody({ params }: Props) {
  await connection()
  const { id } = await params
  const guestId = await getOrCreateGuestId()
  const detail = await db.getSessionDetail(id)

  if (!detail) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-display text-2xl text-sage-deep">This reflection couldn’t be found.</p>
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
    const locale = await getRequestLocale()
    redirect(`/reflect?locale=${locale}`)
  }

  const { messages, mirror, pathways, ...session } = detail
  const userMessageCount = messages.filter((m) => m.role === 'user').length

  return (
    <FuturesWorkspace
      session={session}
      initialMirror={mirror}
      initialPathways={pathways}
      userMessageCount={userMessageCount}
    />
  )
}

export default function FuturesPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-24 text-ink-soft">
          Opening futures…
        </div>
      }
    >
      <FuturesBody params={props.params} />
    </Suspense>
  )
}
