import type { Locale, TranslationKey } from './translations'
import { dictionaries } from './translations'
import { VALUE_PILLARS } from '@/lib/pillars'

const PILLAR_KEYS: Record<string, { label: TranslationKey; hint: TranslationKey }> = {
  health: { label: 'pillarHealth', hint: 'hintHealth' },
  relationships: { label: 'pillarRelationships', hint: 'hintRelationships' },
  work: { label: 'pillarWork', hint: 'hintWork' },
  personal_growth: { label: 'pillarGrowth', hint: 'hintGrowth' },
  finances: { label: 'pillarFinances', hint: 'hintFinances' },
  lifestyle: { label: 'pillarLifestyle', hint: 'hintLifestyle' },
  contribution: { label: 'pillarContribution', hint: 'hintContribution' },
  spirituality: { label: 'pillarSpirituality', hint: 'hintSpirituality' },
}

export function translatePillarLabel(locale: Locale, englishLabel: string) {
  const pillar = VALUE_PILLARS.find((p) => p.label === englishLabel)
  if (!pillar) return englishLabel
  const keys = PILLAR_KEYS[pillar.id]
  return keys ? dictionaries[locale][keys.label] : englishLabel
}

export function localizedPillars(locale: Locale) {
  return VALUE_PILLARS.map((p) => {
    const keys = PILLAR_KEYS[p.id]
    return {
      ...p,
      label: keys ? dictionaries[locale][keys.label] : p.label,
      hint: keys ? dictionaries[locale][keys.hint] : p.hint,
    }
  })
}
