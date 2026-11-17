'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MirrorInsight, Message, Pathway, Session } from '@/lib/types'
import { ReflectionChat } from './ReflectionChat'
import { MirrorSummary } from './MirrorSummary'
import { useLanguage, withLocaleHeaders } from '@/lib/i18n/LanguageProvider'

type Props = {
  session: Session
  initialMessages: Message[]
  initialMirror: MirrorInsight | null
  initialPathways: Pathway[]
}

export function SessionWorkspace({
  session,
  initialMessages,
  initialMirror,
}: Props) {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [mirror, setMirror] = useState(initialMirror)
  const [messages, setMessages] = useState(initialMessages)
  const [busy, setBusy] = useState<'mirror' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sessions/${session.id}`)
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages)
    setMirror(data.mirror)
  }, [session.id])

  async function runMirror() {
    setBusy('mirror')
    setError(null)
    try {
      const res = await fetch(
        `/api/sessions/${session.id}/mirror`,
        withLocaleHeaders(locale, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        }),
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not mirror')
      setMirror(data.mirror)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mirroring paused — try again.')
    } finally {
      setBusy(null)
    }
  }

  const userCount = messages.filter((m) => m.role === 'user').length

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('sessionEyebrow')}</p>
          <h1 className="font-display mt-1 text-3xl text-sage-deep sm:text-4xl">
            {t('sessionTitle')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">{t('sessionSub')}</p>
          {session.title !== 'Reflection' && session.title !== '反思' && (
            <p className="mt-1 text-xs text-ink-soft/80">
              {t('sessionThread')}: {session.title}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runMirror()}
            disabled={busy !== null || userCount < 1}
            className="rounded-xl border border-sage/25 bg-white/45 px-4 py-2 text-sm text-sage-deep transition hover:bg-white/70 disabled:opacity-40"
          >
            {busy === 'mirror' ? t('seeingPatterns') : t('seePatterns')}
          </button>
          <button
            type="button"
            onClick={() => {
              // Kick off generation immediately so work overlaps with navigation.
              void fetch(
                `/api/sessions/${session.id}/pathways`,
                withLocaleHeaders(locale, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ locale }),
                }),
              )
              router.push(`/session/${session.id}/futures`)
            }}
            disabled={userCount < 1}
            className="rounded-xl bg-sage-deep px-4 py-2 text-sm text-[#f4faf7] transition hover:bg-sage disabled:opacity-40"
          >
            {t('imagineFutures')}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-700/80">{error}</p>}

      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <ReflectionChat
          sessionId={session.id}
          initialMessages={messages}
          onUpdated={() => void refresh()}
        />
      </div>

      {mirror && <MirrorSummary mirror={mirror} />}
    </div>
  )
}
