/** Eight life pillars used for recurring values. */

import { mira } from './palette'

export type ValuePillar = {
  id: string
  label: string
  hint: string
  /** Soft playful accent for bars */
  color: string
  cues: RegExp[]
}

export const VALUE_PILLARS: ValuePillar[] = [
  {
    id: 'health',
    label: 'Health',
    hint: 'physical, mental, energy',
    color: mira.sage,
    cues: [
      /\bhealth\b|\bbody\b|\benergy\b|\bsleep\b|\brest\b|\banxiety\b|\bmental\b|\bstress\b|\bworn out\b|\bexhaust|\bburn.?out\b|\bwellbeing\b|\bwell-being\b/i,
    ],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    hint: 'romantic, family, friendships, community',
    color: mira.clay,
    cues: [
      /\brelationship|\bfamily\b|\bfriend|\bpartner\b|\blove\b|\bbelong|\bcommunity\b|\bromantic|\bmom\b|\bdad\b|\bparent|\bspouse\b|\bcoworker|\blonel/i,
    ],
  },
  {
    id: 'work',
    label: 'Work / career',
    hint: 'purpose, growth, financial stability',
    color: mira.forest,
    cues: [
      /\bwork\b|\bcareer\b|\bjob\b|\bprofession|\bpromotion|\bboss\b|\boffice\b|\bambition|\bgrowth\b|\bpurpose\b|\bcalling\b/i,
    ],
  },
  {
    id: 'personal_growth',
    label: 'Personal growth',
    hint: 'learning, creativity, self-awareness',
    color: mira.lavender,
    cues: [
      /\bgrowth\b|\blearn|\bcreativ|\bself-?aware|\bauthent|\bidentity\b|\bcurious|\bexplor|\bmake\b|\bart\b|\bdesign\b|\bwrite\b|\bmastery\b/i,
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    hint: 'security, freedom, long-term planning',
    color: '#5f756c',
    cues: [
      /\bfinanc|\bmoney\b|\bincome\b|\bsaving|\bdebt\b|\bbudget|\bsecurity\b|\bafford|\bstable financially|financial stability|long-?term plan/i,
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    hint: 'where you live, daily rhythms, environment',
    color: '#8a849e',
    cues: [
      /\blifestyle\b|\bdaily\b|\brhythm|\broutine\b|\bhome\b|\blive\b|\bcity\b|\bmove\b|\benvironment\b|\bpace\b|\bmornings?\b|\bwhere i (live|want)/i,
    ],
  },
  {
    id: 'contribution',
    label: 'Contribution',
    hint: 'impact, legacy, giving back',
    color: '#c4a08e',
    cues: [
      /\bcontribut|\bimpact\b|\blegacy\b|\bgiving back\b|\bhelp(ing)? others\b|\bvolunteer|\bservice\b|\bmake a difference\b/i,
    ],
  },
  {
    id: 'spirituality',
    label: 'Spirituality / meaning',
    hint: 'beliefs, values, sense of purpose',
    color: '#6d7f78',
    cues: [
      /\bspirit|\bmeaning\b|\bbelief|\bfaith\b|\bpurpose\b|\bvalues?\b|\bsoul\b|\bmeditation\b|\bmindful|\bfulfill/i,
    ],
  },
]

const ALIAS: Record<string, string> = {
  health: 'health',
  wellbeing: 'health',
  'well-being': 'health',
  energy: 'health',
  relationships: 'relationships',
  relationship: 'relationships',
  connection: 'relationships',
  family: 'relationships',
  love: 'relationships',
  'work / career': 'work',
  work: 'work',
  career: 'work',
  job: 'work',
  purpose: 'work',
  'personal growth': 'personal_growth',
  growth: 'personal_growth',
  creativity: 'personal_growth',
  learning: 'personal_growth',
  authenticity: 'personal_growth',
  mastery: 'personal_growth',
  exploration: 'personal_growth',
  finances: 'finances',
  finance: 'finances',
  money: 'finances',
  security: 'finances',
  stability: 'finances',
  independence: 'finances',
  lifestyle: 'lifestyle',
  home: 'lifestyle',
  contribution: 'contribution',
  impact: 'contribution',
  legacy: 'contribution',
  'spirituality / meaning': 'spirituality',
  spirituality: 'spirituality',
  meaning: 'spirituality',
  fulfillment: 'spirituality',
}

export function pillarById(id: string) {
  return VALUE_PILLARS.find((p) => p.id === id)
}

/** Map a free-form value label onto a pillar id when possible. */
export function mapLabelToPillarId(label: string): string | null {
  const key = label.trim().toLowerCase()
  if (ALIAS[key]) return ALIAS[key]
  for (const p of VALUE_PILLARS) {
    if (p.label.toLowerCase() === key || p.id === key) return p.id
    if (p.cues.some((re) => re.test(label))) return p.id
  }
  return null
}

/** Detect pillar ids present in free text. */
export function detectPillarsFromText(text: string): string[] {
  return VALUE_PILLARS.filter((p) => p.cues.some((re) => re.test(text))).map((p) => p.id)
}

/** Normalize any value list into the eight pillar labels (unique, ordered). */
export function normalizeToPillarLabels(values: string[], sourceText = ''): string[] {
  const ids = new Set<string>()
  for (const v of values) {
    const id = mapLabelToPillarId(v)
    if (id) ids.add(id)
  }
  for (const id of detectPillarsFromText(sourceText)) ids.add(id)

  return VALUE_PILLARS.filter((p) => ids.has(p.id)).map((p) => p.label)
}

/** Build counts for all eight pillars from a list of value labels. */
export function pillarCountsFromValues(values: string[]): { name: string; count: number; id: string; hint: string; color: string }[] {
  const counts = new Map<string, number>()
  for (const p of VALUE_PILLARS) counts.set(p.id, 0)

  for (const v of values) {
    const id = mapLabelToPillarId(v)
    if (id) counts.set(id, (counts.get(id) || 0) + 1)
  }

  return VALUE_PILLARS.map((p) => ({
    id: p.id,
    name: p.label,
    hint: p.hint,
    color: p.color,
    count: counts.get(p.id) || 0,
  }))
}
