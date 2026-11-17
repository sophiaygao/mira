import type { Locale } from '@/lib/i18n/translations'

export type PlanId = 'free' | 'gentle' | 'deepen' | 'continuum'

export type PlanDef = {
  id: PlanId
  name: string
  tagline: string
  priceMonthly: number
  /** Yearly total in USD (paid annually). */
  priceYearly: number
  cta: string
  featured?: boolean
  features: string[]
}

const YEARLY_DISCOUNT = 0.25

export function yearlyPerMonth(plan: PlanDef) {
  return Math.round((plan.priceYearly / 12) * 100) / 100
}

export function yearlySavings(plan: PlanDef) {
  if (plan.priceMonthly <= 0) return 0
  return Math.round(plan.priceMonthly * 12 * YEARLY_DISCOUNT)
}

const en: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Begin reflecting at your own pace.',
    priceMonthly: 0,
    priceYearly: 0,
    cta: 'Continue free',
    features: [
      'Gentle reflective chat',
      'A few sessions each week',
      'Basic pattern glimpse',
      'Companion avatar (1)',
    ],
  },
  {
    id: 'gentle',
    name: 'Gentle',
    tagline: 'More room to sit with what matters.',
    priceMonthly: 3.99,
    priceYearly: 35.88,
    cta: 'Choose Gentle',
    features: [
      'Everything in Free',
      'More reflection sessions',
      'Full adaptive mirror',
      'Dashboard history',
      'Companion pet on every page',
    ],
  },
  {
    id: 'deepen',
    name: 'Deepen',
    tagline: 'For ongoing self-discovery.',
    priceMonthly: 7.99,
    priceYearly: 71.88,
    cta: 'Choose Deepen',
    featured: true,
    features: [
      'Everything in Gentle',
      'Imagine futures + personas',
      'Empathic voice sessions',
      'Priority avatar & persona art',
      'Richer theme evolution',
    ],
  },
  {
    id: 'continuum',
    name: 'Continuum',
    tagline: 'Stay with Mira without watching the clock.',
    priceMonthly: 14.99,
    priceYearly: 134.88,
    cta: 'Choose Continuum',
    features: [
      'Everything in Deepen',
      'Highest session limits',
      'Early access to new tools',
      'Multiple companion looks',
      'Quiet support when you need it',
    ],
  },
]

const zh: PlanDef[] = [
  {
    id: 'free',
    name: '免费',
    tagline: '按自己的节奏开始反思。',
    priceMonthly: 0,
    priceYearly: 0,
    cta: '继续免费使用',
    features: ['温柔的反思对话', '每周几次会话', '基础模式一瞥', '陪伴头像（1 个）'],
  },
  {
    id: 'gentle',
    name: '轻柔',
    tagline: '有更多空间，陪你坐一坐真正重要的事。',
    priceMonthly: 3.99,
    priceYearly: 35.88,
    cta: '选择轻柔',
    features: [
      '包含免费版全部内容',
      '更多反思会话',
      '完整自适应映照',
      '仪表盘历史',
      '全站陪伴宠物',
    ],
  },
  {
    id: 'deepen',
    name: '深入',
    tagline: '适合持续的自我探索。',
    priceMonthly: 7.99,
    priceYearly: 71.88,
    cta: '选择深入',
    featured: true,
    features: [
      '包含轻柔版全部内容',
      '想象未来 + 人设形象',
      '共情语音会话',
      '优先头像与人设生成',
      '更丰富的主题演变',
    ],
  },
  {
    id: 'continuum',
    name: '延续',
    tagline: '与 Mira 同行，不必盯着额度。',
    priceMonthly: 14.99,
    priceYearly: 134.88,
    cta: '选择延续',
    features: [
      '包含深入版全部内容',
      '最高会话额度',
      '新功能抢先体验',
      '多种陪伴形象',
      '需要时的安静支持',
    ],
  },
]

export function plansFor(locale: Locale): PlanDef[] {
  return locale === 'zh' ? zh : en
}
