'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'
import { plansFor, yearlyPerMonth, type PlanId } from '@/lib/plans'

type Billing = 'monthly' | 'yearly'

export function PlansPricing() {
  const { t, locale } = useLanguage()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [notice, setNotice] = useState<string | null>(null)
  const plans = useMemo(() => plansFor(locale), [locale])

  function onChoose(id: PlanId) {
    if (id === 'free') {
      setNotice(null)
      return
    }
    setNotice(t('plansBillingSoon'))
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-2 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('plansEyebrow')}</p>
        <h1 className="font-display mt-2 text-3xl text-sage-deep sm:text-4xl">{t('plansTitle')}</h1>
        <p className="font-editorial mt-3 text-lg leading-snug text-ink">{t('plansSub')}</p>
        <p className="mt-2 text-sm text-ink-soft">{t('plansAffordable')}</p>
      </div>

      <div className="mt-8 flex justify-center">
        <div
          className="inline-flex items-center rounded-full border border-sage/20 bg-white/45 p-0.5 backdrop-blur-sm"
          role="group"
          aria-label={t('plansBilling')}
        >
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              billing === 'monthly'
                ? 'bg-forest text-linen'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t('plansMonthly')}
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              billing === 'yearly'
                ? 'bg-forest text-linen'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t('plansYearly')}
            <span className="ml-1.5 text-[0.7rem] opacity-80">{t('plansSave')}</span>
          </button>
        </div>
      </div>

      {notice && (
        <p className="mx-auto mt-5 max-w-md rounded-xl border border-sage/20 bg-white/55 px-4 py-2.5 text-center text-sm text-ink">
          {notice}
        </p>
      )}

      <div className="mt-10 grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isFree = plan.priceMonthly === 0
          const price =
            billing === 'yearly' && !isFree
              ? yearlyPerMonth(plan)
              : plan.priceMonthly
          const priceLabel = isFree
            ? t('plansFreePrice')
            : `$${price.toFixed(2)}`
          const period =
            isFree
              ? ''
              : billing === 'yearly'
                ? t('plansPerMonthBilledYearly')
                : t('plansPerMonth')

          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-5 transition ${
                plan.featured
                  ? 'border border-sage/35 bg-white/70 shadow-[0_16px_40px_rgba(52,79,70,0.08)] ring-1 ring-sage/15'
                  : 'glass-panel'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-forest px-2.5 py-0.5 text-[0.65rem] font-medium tracking-wide text-linen">
                  {t('plansPopular')}
                </span>
              )}

              <h2 className="font-display text-xl text-sage-deep">{plan.name}</h2>
              <p className="mt-1.5 min-h-[2.6rem] text-sm leading-snug text-ink-soft">
                {plan.tagline}
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl text-forest">{priceLabel}</span>
                {period && (
                  <span className="text-sm text-ink-soft">{period}</span>
                )}
              </div>
              {billing === 'yearly' && !isFree && (
                <p className="mt-1 text-xs text-ink-soft">
                  {t('plansBilledAs')} ${plan.priceYearly.toFixed(2)}
                  {t('plansPerYear')}
                </p>
              )}

              {isFree ? (
                <Link
                  href={reflectHref(locale)}
                  className="mt-6 inline-flex justify-center rounded-xl border border-sage/25 bg-white/50 px-4 py-2.5 text-sm text-sage-deep transition hover:bg-white/75"
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onChoose(plan.id)}
                  className={`mt-6 inline-flex justify-center rounded-xl px-4 py-2.5 text-sm transition ${
                    plan.featured
                      ? 'bg-sage-deep text-linen hover:bg-sage'
                      : 'border border-sage/25 bg-white/50 text-sage-deep hover:bg-white/75'
                  }`}
                >
                  {plan.cta}
                </button>
              )}

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-ink">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-ink-soft/80">
        {t('plansFootnote')}
      </p>
    </div>
  )
}
