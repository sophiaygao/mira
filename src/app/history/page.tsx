'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@/lib/types'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'

export default function HistoryPage() {
  const { t, locale } = useLanguage()
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/sessions')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setSessions(json.sessions)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load history')
      }
    })()
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 sm:px-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('historyEyebrow')}</p>
        <h1 className="font-display mt-1 text-3xl text-sage-deep sm:text-4xl">{t('historyTitle')}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t('historySub')}</p>
      </div>

      {error && <p className="text-sm text-red-700/80">{error}</p>}
      {!sessions && !error && <p className="text-sm text-ink-soft">{t('loading')}</p>}

      {sessions && sessions.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-ink-soft">{t('noReflections')}</p>
          <Link
            href={reflectHref(locale)}
            className="mt-4 inline-block text-sage-deep underline-offset-4 hover:underline"
          >
            {t('beginFirst')}
          </Link>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/session/${s.id}`}
                className="glass-panel block rounded-2xl p-5 transition hover:bg-white/65"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-sage-deep">{s.title}</h2>
                  <span className="text-xs uppercase tracking-[0.06em] text-ink-soft">
                    {s.status}
                  </span>
                </div>
                <time className="mt-2 block text-sm text-ink-soft">
                  {new Date(s.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
