'use client'

import { useMemo } from 'react'
import type { DashboardData } from '@/lib/types'
import Link from 'next/link'
import { pillarCountsFromValues, VALUE_PILLARS } from '@/lib/pillars'
import { mira, miraEmotions, miraThemes, miraTensions } from '@/lib/palette'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { localizedPillars, translatePillarLabel } from '@/lib/i18n/pillars-i18n'

type StatItem = { name: string; count: number }

type BloomNode = StatItem & {
  color: string
  size: number
  x: number
  y: number
  delay: number
}

/** Soft spiral constellation — larger orbs = more frequent. */
function layoutBloom(data: StatItem[], colors: readonly string[]): BloomNode[] {
  const items = [...data]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  if (items.length === 0) return []

  const max = Math.max(...items.map((d) => d.count))
  const min = Math.min(...items.map((d) => d.count))
  const span = Math.max(1, max - min)

  return items.map((item, i) => {
    const t = (item.count - min) / span
    const size = 44 + t * 56 // 44–100px — fits a 3-up row
    const angle = i === 0 ? -0.4 : i * 2.35 + 0.15
    const orbit = i === 0 ? 0 : 32 + i * 22 + (1 - t) * 8
    const x = 50 + Math.cos(angle) * (orbit / 3.05)
    const y = 48 + Math.sin(angle) * (orbit / 3.4)
    return {
      ...item,
      color: colors[i % colors.length]!,
      size,
      x: Math.min(88, Math.max(12, x)),
      y: Math.min(86, Math.max(14, y)),
      delay: i * 0.12,
    }
  })
}

function StatConstellation({
  title,
  subtitle,
  data,
  empty,
  colors,
  tone = 'round',
}: {
  title: string
  subtitle: string
  data: StatItem[]
  empty: string
  colors: readonly string[]
  tone?: 'round' | 'soft' | 'petal'
}) {
  const nodes = useMemo(() => layoutBloom(data, colors), [data, colors])

  return (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="font-display text-xl text-sage-deep">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>

      {nodes.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">{empty}</p>
      ) : (
        <>
          <div className="mira-bloom mt-4" role="img" aria-label={title}>
            {nodes.map((node) => (
              <div
                key={node.name}
                className={`mira-bloom__orb mira-bloom__orb--${tone}`}
                title={`${node.name} ×${node.count}`}
                style={{
                  width: node.size,
                  height: node.size,
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, white 55%, ${node.color}), ${node.color})`,
                  animationDelay: `${node.delay}s`,
                  boxShadow: `0 10px 28px color-mix(in srgb, ${node.color} 28%, transparent)`,
                }}
              >
                <span className="mira-bloom__label">{node.name}</span>
                <span className="mira-bloom__count">×{node.count}</span>
              </div>
            ))}
          </div>

          <ul className="mira-bloom__legend">
            {nodes.map((node) => (
              <li key={`legend-${node.name}`}>
                <span
                  className="mira-bloom__swatch"
                  style={{ background: node.color }}
                  aria-hidden
                />
                <span className="mira-bloom__legend-name">{node.name}</span>
                <span className="mira-bloom__legend-count">×{node.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function ValuesPillars({ values }: { values: { name: string; count: number }[] }) {
  const { t, locale } = useLanguage()
  const flat = values.flatMap((v) => Array.from({ length: v.count }, () => v.name))
  const counts = pillarCountsFromValues(flat)
  const pillars = localizedPillars(locale).map((p) => ({
    ...p,
    count: counts.find((c) => c.id === p.id)?.count || 0,
  }))
  const max = Math.max(1, ...pillars.map((p) => p.count))
  const any = pillars.some((p) => p.count > 0)

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-45"
        style={{
          background: `radial-gradient(circle, ${mira.wisteria}aa, transparent 70%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-6 h-40 w-40 rounded-full opacity-40"
        style={{
          background: `radial-gradient(circle, ${mira.mist}cc, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative">
        <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{t('lifePillars')}</p>
        <h3 className="font-display mt-1 text-2xl text-sage-deep">{t('recurringValues')}</h3>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">{t('recurringValuesSub')}</p>

        {!any ? (
          <p className="mt-8 text-sm text-ink-soft">{t('pillarsEmpty')}</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {pillars.map((p, i) => {
              const pct = Math.round((p.count / max) * 100)
              const lit = p.count > 0
              return (
                <li
                  key={p.id}
                  className={`animate-rise rounded-2xl border px-3.5 py-3 transition ${
                    lit
                      ? 'border-white/70 bg-white/55 shadow-[0_8px_24px_rgba(52,79,70,0.06)]'
                      : 'border-transparent bg-white/25 opacity-55'
                  }`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{p.label}</p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-ink-soft">{p.hint}</p>
                    </div>
                    <span
                      className="grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-medium text-linen"
                      style={{ background: lit ? p.color : mira.mist }}
                    >
                      {p.count}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-forest/5">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: lit ? `${Math.max(12, pct)}%` : '0%',
                        background: `linear-gradient(90deg, ${p.color}, ${p.color}b8)`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-4 text-[0.7rem] text-ink-soft/80">
          {VALUE_PILLARS.length} {t('pillarsHint')}
        </p>
      </div>
    </div>
  )
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  const { t, locale } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('sessions'), value: data.sessions.length, tint: mira.sage },
          { label: t('themesMirrored'), value: data.themes.length, tint: mira.lavender },
          { label: t('pathwaysImagined'), value: data.pathwayCount, tint: mira.clay },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel relative overflow-hidden rounded-3xl p-5"
          >
            <div
              className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-35"
              style={{ background: s.tint }}
              aria-hidden
            />
            <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">{s.label}</p>
            <p className="font-display mt-2 text-3xl text-sage-deep">{s.value}</p>
          </div>
        ))}
      </div>

      <ValuesPillars values={data.values} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatConstellation
          title={t('recurringEmotions')}
          subtitle={t('recurringEmotionsSub')}
          data={data.emotions}
          empty={t('emotionsEmpty')}
          colors={miraEmotions}
          tone="round"
        />
        <StatConstellation
          title={t('recurringThemes')}
          subtitle={t('recurringThemesSub')}
          data={data.themes}
          empty={t('themesEmpty')}
          colors={miraThemes}
          tone="soft"
        />
        <StatConstellation
          title={t('recurringTensions')}
          subtitle={t('recurringTensionsSub')}
          data={data.tensions}
          empty={t('tensionsEmpty')}
          colors={miraTensions}
          tone="petal"
        />
      </div>

      <section className="glass-panel rounded-3xl p-5 sm:p-6">
        <h3 className="font-display text-xl text-sage-deep">{t('themeEvolution')}</h3>
        <p className="mt-1 text-sm text-ink-soft">{t('themeEvolutionSub')}</p>
        {data.timeline.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">{t('noSessionsYet')}</p>
        ) : (
          <ol className="mt-6 space-y-4">
            {data.timeline.map((item) => (
              <li key={item.sessionId} className="flex gap-4 border-l-2 border-sage/30 pl-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      href={`/session/${item.sessionId}`}
                      className="font-medium text-ink hover:text-sage-deep"
                    >
                      {item.title}
                    </Link>
                    <time className="text-xs text-ink-soft">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.themes.length
                      ? item.themes.join(' · ')
                      : item.values.length
                        ? item.values.map((v) => translatePillarLabel(locale, v)).join(' · ')
                        : t('reflectionInProgress')}
                  </p>
                  {item.values.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.values.slice(0, 4).map((v) => {
                        const color =
                          VALUE_PILLARS.find((p) => p.label === v)?.color || mira.sage
                        return (
                          <span
                            key={v}
                            className="rounded-full px-2 py-0.5 text-[0.68rem] text-linen"
                            style={{ background: color }}
                          >
                            {translatePillarLabel(locale, v)}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
