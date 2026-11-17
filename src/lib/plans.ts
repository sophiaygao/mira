import type { TranslationKey } from '@/lib/i18n/translations'

export type PlanId = 'free' | 'plus' | 'deep'
export type BillingCycle = 'monthly' | 'yearly'

export type PlanDef = {
  id: PlanId
  nameKey: TranslationKey
  blurbKey: TranslationKey
  ctaKey: TranslationKey
  /** USD per month when billed monthly */
  monthlyPrice: number
  /** Effective USD per month when billed yearly */
  yearlyPerMonth: number
  /** Total yearly charge */
  yearlyTotal: number
  featured?: boolean
  features: TranslationKey[]
}

/** Affordable tiers — inspired by ChatGPT’s ladder, priced for Mira. */
export const MIRA_PLANS: PlanDef[] = [
  {
    id: 'free',
    nameKey: 'planFreeName',
    blurbKey: 'planFreeBlurb',
    ctaKey: 'planFreeCta',
    monthlyPrice: 0,
    yearlyPerMonth: 0,
    yearlyTotal: 0,
    features: [
      'planFreeF1',
      'planFreeF2',
      'planFreeF3',
      'planFreeF4',
      'planFreeF5',
    ],
  },
  {
    id: 'plus',
    nameKey: 'planPlusName',
    blurbKey: 'planPlusBlurb',
    ctaKey: 'planPlusCta',
    monthlyPrice: 6,
    yearlyPerMonth: 4,
    yearlyTotal: 48,
    featured: true,
    features: [
      'planPlusF1',
      'planPlusF2',
      'planPlusF3',
      'planPlusF4',
      'planPlusF5',
      'planPlusF6',
    ],
  },
  {
    id: 'deep',
    nameKey: 'planDeepName',
    blurbKey: 'planDeepBlurb',
    ctaKey: 'planDeepCta',
    monthlyPrice: 12,
    yearlyPerMonth: 8,
    yearlyTotal: 96,
    features: [
      'planDeepF1',
      'planDeepF2',
      'planDeepF3',
      'planDeepF4',
      'planDeepF5',
      'planDeepF6',
    ],
  },
]

export function planPriceLabel(plan: PlanDef, cycle: BillingCycle) {
  if (plan.monthlyPrice === 0) return { amount: '$0', suffix: '' }
  if (cycle === 'monthly') {
    return { amount: `$${plan.monthlyPrice}`, suffix: '/mo' }
  }
  return { amount: `$${plan.yearlyPerMonth}`, suffix: '/mo' }
}
