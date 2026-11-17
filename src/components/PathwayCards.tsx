'use client'

import type { Pathway } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { translatePillarLabel } from '@/lib/i18n/pillars-i18n'

export function PathwayCards({
  pathways,
  hideIntro = false,
  personas = {},
  personasLoading = false,
}: {
  pathways: Pathway[]
  hideIntro?: boolean
  /** pathwayId → persona image URL */
  personas?: Record<string, string>
  personasLoading?: boolean
}) {
  const { t, locale } = useLanguage()
  const showPersonaSlot = personasLoading || Object.keys(personas).length > 0

  return (
    <section className="space-y-4">
      {!hideIntro && (
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('pathwaysEyebrow')}</p>
          <h2 className="font-display mt-1 text-2xl text-sage-deep">{t('pathwaysTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">{t('pathwaysSub')}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {pathways.map((p) => {
          const personaSrc = personas[p.id]
          return (
            <article
              key={p.id}
              className="glass-panel animate-rise flex flex-col rounded-2xl p-5"
            >
              {showPersonaSlot && (
                <div className="mira-pathway-persona mb-4">
                  {personaSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={personaSrc} alt="" className="mira-pathway-persona__img" />
                  ) : personasLoading ? (
                    <span className="mira-pathway-persona__skeleton" aria-hidden />
                  ) : null}
                </div>
              )}

              <h3 className="font-display text-xl leading-snug text-sage-deep">{p.title}</h3>
              <p className="font-editorial mt-3 flex-1 text-[1.02rem] leading-relaxed text-ink">
                {p.description}
              </p>

              {p.values.length > 0 && (
                <div className="mt-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">{t('values')}</p>
                  <p className="mt-1 text-sm text-ink">
                    {p.values.map((v) => translatePillarLabel(locale, v)).join(' · ')}
                  </p>
                </div>
              )}

              {p.opportunities.length > 0 && (
                <div className="mt-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">
                    {t('opportunities')}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink">
                    {p.opportunities.map((o) => (
                      <li key={o}>· {o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {p.tradeoffs.length > 0 && (
                <div className="mt-3">
                  <p className="text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">{t('tradeoffs')}</p>
                  <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                    {p.tradeoffs.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
