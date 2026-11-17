'use client'

import type { EmotionTop } from '@/lib/hume-shared'

const LABEL: Record<string, string> = {
  Calmness: 'Calm',
  Contemplation: 'Contemplative',
  Interest: 'Interest',
  Joy: 'Warmth',
  Sadness: 'Tenderness',
  Anxiety: 'Unease',
  Determination: 'Resolve',
  EmpathicPain: 'Empathy',
  Tiredness: 'Tired',
  Confusion: 'Uncertainty',
}

export function ExpressionBars({
  emotions,
  caption = 'Vocal expression',
}: {
  emotions: EmotionTop[]
  caption?: string
}) {
  if (!emotions.length) return null

  return (
    <div className="space-y-2">
      <p className="text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">{caption}</p>
      <ul className="space-y-2">
        {emotions.map((e) => (
          <li key={e.name} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2">
            <span className="truncate text-sm text-ink">{LABEL[e.name] || e.name}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-sage/15">
              <div
                className="h-full rounded-full bg-sage-deep/70 transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(4, Math.min(100, e.score * 100))}%` }}
              />
            </div>
            <span className="text-right text-xs text-ink-soft">{e.score.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
