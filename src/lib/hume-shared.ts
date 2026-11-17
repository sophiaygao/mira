export type EmotionTop = { name: string; score: number }

/** Calm Ito voice from Hume Voice Library (EVI 3) */
export const MIRA_HUME_VOICE = {
  id: 'f60ecf9e-ff1e-4bae-9206-dba7c653a69e',
  provider: 'HUME_AI' as const,
}

export function topEmotions(
  scores: Record<string, number> | undefined | null,
  n = 3,
): EmotionTop[] {
  if (!scores) return []
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, score]) => ({ name, score }))
}
