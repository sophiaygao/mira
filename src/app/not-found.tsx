'use client'

import Link from 'next/link'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'

export default function NotFound() {
  const { t, locale } = useLanguage()
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('notFoundEyebrow')}</p>
      <h1 className="font-display mt-3 text-3xl text-sage-deep">{t('notFoundTitle')}</h1>
      <p className="mt-3 text-sm text-ink-soft">{t('notFoundBody')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl border border-sage/25 bg-white/45 px-5 py-2.5 text-sm text-sage-deep transition hover:bg-white/70"
        >
          {t('home')}
        </Link>
        <Link
          href={reflectHref(locale)}
          className="rounded-xl bg-sage-deep px-5 py-2.5 text-sm text-[#f4faf7] transition hover:bg-sage"
        >
          {t('homeBegin')}
        </Link>
      </div>
    </div>
  )
}
