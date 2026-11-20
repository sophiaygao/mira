import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getOrCreateGuestId } from '@/lib/guest'
import * as db from '@/lib/db'
import { getRequestLocale } from '@/lib/i18n/server-locale'
import { isLocale, type Locale } from '@/lib/i18n/translations'
import { pickOpeningPrompt } from '@/lib/openings'

export const instant = false

type Props = {
  searchParams: Promise<{ locale?: string }>
}

/** Create a session and jump straight into chat — no client loading hop. */
export default async function ReflectPage({ searchParams }: Props) {
  await connection()

  const params = await searchParams
  const fromQuery = isLocale(params.locale) ? (params.locale as Locale) : null
  const locale = fromQuery ?? (await getRequestLocale())

  const guestId = await getOrCreateGuestId()
  const session = await db.createSession(
    guestId,
    locale === 'zh' ? '反思' : 'Reflection',
  )

  await db.addMessage({
    session_id: session.id,
    role: 'mira',
    content: pickOpeningPrompt(locale),
  })

  redirect(`/session/${session.id}`)
}
