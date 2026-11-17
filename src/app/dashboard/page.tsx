'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DashboardData } from '@/lib/types'
import { DashboardCharts } from '@/components/DashboardCharts'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'

export default function DashboardPage() {
  const { t, locale } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load dashboard')
      }
    })()
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-2 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('dashEyebrow')}</p>
          <h1 className="font-display mt-1 text-3xl text-sage-deep sm:text-4xl">{t('dashTitle')}</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">{t('dashSub')}</p>
        </div>
        <Link
          href={reflectHref(locale)}
          className="inline-flex rounded-xl bg-sage-deep px-4 py-2 text-sm text-[#f4faf7] transition hover:bg-sage"
        >
          {t('newReflection')}
        </Link>
      </div>

      {error && <p className="text-sm text-red-700/80">{error}</p>}
      {!data && !error && <p className="text-sm text-ink-soft">{t('gathering')}</p>}
      {data && <DashboardCharts data={data} />}
    </div>
  )
}
