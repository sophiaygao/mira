'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage, reflectHref } from '@/lib/i18n/LanguageProvider'
import { MIRA_PLANS, planPriceLabel, type BillingCycle, type PlanId } from '@/lib/plans'

export function PlansPricing() {
  const { t, locale } = useLanguage()
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [picked, setPicked] = useState<PlanId | null>(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-2 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('plansEyebrow')}</p>
        <h1 className="font-display mt-2 text-3xl text-sage-deep sm:text-4xl">{t('plansTitle')}</h1>
        <p className="font-editorial mt-3 text-lg leading-snug text-ink">{t('plansSub')}</p>

        <div
          className="mt-8 inline-flex items-center rounded-full border border-sage/20 bg-white/45 p-1"
          role="group"
          aria-label="Billing cycle"
        >
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              cycle === 'monthly' ? 'bg-forest text-linen' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t('plansMonthly')}
          </button>
          <button
            type="button"
            onClick={() => setCycle('yearly')}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              cycle === 'yearly' ? 'bg-forest text-linen' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t('plansYearly')}
            <span className="ml-1.5 text-[0.7rem] opacity-80">{t('plansSave')}</span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {MIRA_PLANS.map((plan) => {
          const price = planPriceLabel(plan, cycle)
          const featured = Boolean(plan.featured)
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 transition ${
                featured
                  ? 'border border-sage/35 bg-white/70 shadow-[0_16px_40px_rgba(52,79,70,0.08)]'
                  : 'glass-panel'
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage-deep px-3 py-0.5 text-[0.68rem] font-medium tracking-wide text-linen">
                  {t('plansPopular')}
                </span>
              )}

              <h2 className="font-display text-2xl text-sage-deep">{t(plan.nameKey)}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t(plan.blurbKey)}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl text-forest">{price.amount}</span>
                {price.suffix && <span className="text-sm text-ink-soft">{price.suffix}</span>}
              </div>
              {cycle === 'yearly' && plan.yearlyTotal > 0 && (
                <p className="mt-1 text-xs text-ink-soft">
                  {t('plansBilledYearly').replace('${total}', String(plan.yearlyTotal))}
                </p>
              )}

              <button
                type="button"
                onClick={() => setPicked(plan.id)}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm transition ${
                  featured
                    ? 'bg-sage-deep text-linen hover:bg-sage'
                    : 'border border-sage/25 bg-white/50 text-sage-deep hover:bg-white/75'
                }`}
              >
                {t(plan.ctaKey)}
              </button>

              {picked === plan.id && (
                <p className="mt-3 text-center text-xs text-ink-soft">{t('plansThanks')}</p>
              )}

              <p className="mt-6 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">
                {t('plansIncludes')}
              </p>
              <ul className="mt-2 space-y-2">
                {plan.features.map((key) => (
                  <li key={key} className="flex gap-2 text-sm text-ink">
                    <span className="mt-0.5 text-sage" aria-hidden>
                      ✓
                    </span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-ink-soft/80">
        {t('plansNote')}
      </p>

      <div className="mt-8 flex justify-center">
        <Link
          href={reflectHref(locale)}
          className="rounded-xl border border-sage/25 bg-white/40 px-5 py-2.5 text-sm text-sage-deep transition hover:bg-white/60"
        >
          {t('homeBegin')}
        </Link>
      </div>
    </div>
  )
}
