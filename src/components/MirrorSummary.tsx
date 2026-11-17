'use client'

import type { MirrorInsight } from '@/lib/types'
import { VALUE_PILLARS } from '@/lib/pillars'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { translatePillarLabel } from '@/lib/i18n/pillars-i18n'

function ChipGroup({ label, items, colorful }: { label: string; items: string[]; colorful?: boolean }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-[0.08em] text-ink-soft">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => {
          const pillar = colorful
            ? VALUE_PILLARS.find(
                (p) => p.label === item || translatePillarLabel('zh', p.label) === item,
              )
            : undefined
          return (
            <span
              key={`${item}-${idx}`}
              className="rounded-full border border-sage/20 bg-white/45 px-2.5 py-1 text-sm text-ink"
              style={
                colorful && pillar
                  ? {
                      background: `${pillar.color}22`,
                      borderColor: `${pillar.color}55`,
                      color: '#2c3a36',
                    }
                  : undefined
              }
              title={pillar?.hint}
            >
              {item}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function MirrorSummary({ mirror }: { mirror: MirrorInsight }) {
  const { t, locale } = useLanguage()
  const valueLabels = mirror.values.map((v) => translatePillarLabel(locale, v))

  return (
    <section className="glass-panel animate-rise space-y-6 rounded-2xl p-5 sm:p-6">
      <div>
        <h2 className="font-display text-2xl text-sage-deep">{t('mirrorTitle')}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{t('mirrorSub')}</p>
      </div>

      <ul className="space-y-3">
        {mirror.summary_lines.map((line) => (
          <li
            key={line}
            className="border-l-2 border-sage/40 pl-4 font-editorial text-lg leading-snug text-ink"
          >
            {line}
          </li>
        ))}
      </ul>

      <div className="grid gap-5 sm:grid-cols-2">
        <ChipGroup label={t('values')} items={valueLabels} colorful />
        <ChipGroup label={t('motivations')} items={mirror.motivations} />
        <ChipGroup label={t('tensions')} items={mirror.tensions} />
        <ChipGroup label={t('emotions')} items={mirror.emotions} />
      </div>

      {mirror.themes.length > 0 && <ChipGroup label={t('themes')} items={mirror.themes} />}
    </section>
  )
}
