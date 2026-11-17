'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { MirrorInsight, Pathway, Session } from '@/lib/types'
import { PathwayCards } from './PathwayCards'
import { MirrorSummary } from './MirrorSummary'
import { useLanguage, withLocaleHeaders } from '@/lib/i18n/LanguageProvider'
import { useAvatar } from '@/lib/avatar/AvatarProvider'

type Props = {
  session: Session
  initialMirror: MirrorInsight | null
  initialPathways: Pathway[]
  userMessageCount: number
}

export function FuturesWorkspace({
  session,
  initialMirror,
  initialPathways,
  userMessageCount,
}: Props) {
  const { t, locale } = useLanguage()
  const { url: avatarUrl } = useAvatar()
  const [mirror, setMirror] = useState(initialMirror)
  const [pathways, setPathways] = useState(initialPathways)
  const [busy, setBusy] = useState(initialPathways.length === 0 && userMessageCount > 0)
  const [error, setError] = useState<string | null>(null)
  const [personas, setPersonas] = useState<Record<string, string>>({})
  const [personasLoading, setPersonasLoading] = useState(false)
  const started = useRef(false)
  const personasStarted = useRef(false)

  const applyResult = useCallback((data: { mirror?: MirrorInsight; pathways?: Pathway[] }) => {
    if (data.mirror) setMirror(data.mirror)
    if (data.pathways?.length) setPathways(data.pathways)
  }, [])

  const loadFutures = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      // Prefer finishing an in-flight generate (started on button click).
      const res = await fetch(
        `/api/sessions/${session.id}/pathways`,
        withLocaleHeaders(locale, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        }),
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not generate pathways')
      applyResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('futuresFailed'))
    } finally {
      setBusy(false)
    }
  }, [session.id, locale, applyResult, t])

  useEffect(() => {
    if (started.current) return
    if (initialPathways.length > 0 || userMessageCount < 1) return
    started.current = true

    let cancelled = false
    let polls = 0

    // Soft-poll in case the click-started request finishes before our POST joins it.
    const poll = window.setInterval(() => {
      if (cancelled || polls > 40) {
        window.clearInterval(poll)
        return
      }
      polls += 1
      void (async () => {
        const res = await fetch(`/api/sessions/${session.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.pathways?.length) {
          window.clearInterval(poll)
          applyResult({ mirror: data.mirror, pathways: data.pathways })
          setBusy(false)
        }
      })()
    }, 400)

    void loadFutures().finally(() => {
      window.clearInterval(poll)
    })

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [session.id, initialPathways.length, userMessageCount, loadFutures, applyResult])

  // After pathways exist, restyle the companion avatar into three future personas.
  useEffect(() => {
    if (!avatarUrl || pathways.length === 0 || busy) return
    if (personasStarted.current) return
    personasStarted.current = true
    setPersonasLoading(true)

    void (async () => {
      try {
        const res = await fetch(`/api/sessions/${session.id}/pathways/personas`, {
          method: 'POST',
        })
        const data = await res.json()
        if (res.ok && data.personas && typeof data.personas === 'object') {
          setPersonas(data.personas as Record<string, string>)
        }
      } catch {
        /* personas are optional enrichment */
      } finally {
        setPersonasLoading(false)
      }
    })()
  }, [avatarUrl, pathways, busy, session.id])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('pathwaysEyebrow')}</p>
          <h1 className="font-display mt-1 text-3xl text-sage-deep sm:text-4xl">
            {t('pathwaysTitle')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">{t('pathwaysSub')}</p>
          {session.title !== 'Reflection' && session.title !== '反思' && (
            <p className="mt-1 text-xs text-ink-soft/80">
              {t('sessionThread')}: {session.title}
            </p>
          )}
        </div>
        <Link
          href={`/session/${session.id}`}
          className="inline-flex rounded-xl border border-sage/25 bg-white/45 px-4 py-2 text-sm text-sage-deep transition hover:bg-white/70"
        >
          ← {t('backToReflection')}
        </Link>
      </div>

      {busy && (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-sage" />
          <p className="font-display mt-6 text-2xl text-sage-deep">{t('imaginingFutures')}</p>
          <p className="font-editorial mt-2 max-w-sm text-base text-ink-soft">
            {t('futuresLoadingSub')}
          </p>
        </div>
      )}

      {error && (
        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-sm text-red-700/80">{error}</p>
          <button
            type="button"
            onClick={() => {
              started.current = true
              void loadFutures()
            }}
            className="mt-4 rounded-xl bg-sage-deep px-4 py-2 text-sm text-[#f4faf7] transition hover:bg-sage"
          >
            {t('imagineFutures')}
          </button>
        </div>
      )}

      {!busy && !error && userMessageCount < 1 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-ink-soft">{t('futuresNeedReflection')}</p>
          <Link
            href={`/session/${session.id}`}
            className="mt-4 inline-block text-sage-deep underline-offset-4 hover:underline"
          >
            {t('backToReflection')}
          </Link>
        </div>
      )}

      {!busy && pathways.length > 0 && (
        <>
          <PathwayCards
            pathways={pathways}
            hideIntro
            personas={personas}
            personasLoading={Boolean(avatarUrl) && personasLoading}
          />
          {mirror && <MirrorSummary mirror={mirror} />}
        </>
      )}
    </div>
  )
}
