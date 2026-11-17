'use client'

import Link from 'next/link'
import { Mark } from '@/components/Mark'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'

export default function HomePage() {
  const { t, locale } = useLanguage()

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Mark className="animate-breathe mb-7 h-[4.5rem] w-[4.5rem] text-sage-deep" />
      <h1 className="font-display text-[clamp(3.25rem,12vw,5rem)] font-medium leading-none tracking-tight text-sage-deep">
        Mira
      </h1>
      <p className="font-editorial mt-5 max-w-[24ch] text-[clamp(1.3rem,3.5vw,1.65rem)] leading-snug text-ink">
        {t('homeHeadline')}
      </p>
      <p className="mt-3 max-w-[34ch] text-[1.05rem] font-normal text-ink-soft">{t('homeSub')}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={reflectHref(locale)}
          className="rounded-xl bg-sage-deep px-8 py-3 text-[#f4faf7] transition hover:bg-sage"
        >
          {t('homeBegin')}
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-sage/25 bg-white/40 px-6 py-3 text-sage-deep transition hover:bg-white/60"
        >
          {t('homeDashboard')}
        </Link>
        <Link
          href="/plans"
          className="rounded-xl border border-sage/20 bg-transparent px-6 py-3 text-sm text-ink-soft transition hover:border-sage/35 hover:text-ink"
        >
          {t('homePlans')}
        </Link>
      </div>
      <p className="mt-10 max-w-[38ch] text-xs leading-relaxed text-ink-soft/80">
        {t('homeDisclaimer')}
      </p>
    </section>
  )
}
