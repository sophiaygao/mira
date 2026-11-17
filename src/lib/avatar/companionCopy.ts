import type { Locale } from '@/lib/i18n/translations'

/** Soft reflective micro-copy for the companion pet — non-prescriptive, one invitation. */

export const companionThinkingAsides: Record<Locale, string[]> = {
  en: [
    'Sitting with that with you…',
    'Holding what you just shared…',
    'Listening underneath the words…',
    'Letting this settle for a moment…',
  ],
  zh: [
    '陪你一起坐一坐…',
    '先接住你刚说的…',
    '听一听话里更轻的那一层…',
    '先让它落一落…',
  ],
}

export const companionSettledAsides: Record<Locale, string[]> = {
  en: [
    'I’m here if more wants to come.',
    'We can stay with this as long as you need.',
    'No rush — whatever feels true.',
    'That can rest here for a while.',
  ],
  zh: [
    '如果还有话想说，我在。',
    '我们可以慢慢待在这里。',
    '不着急——跟随着真实的感觉就好。',
    '这些可以先放在这里。',
  ],
}

export const companionNudges: Record<Locale, string[]> = {
  en: [
    'What feels heaviest in this, right now?',
    'If nothing had to be decided today, what would you notice first?',
    'What part of this still feels unfinished?',
    'Where do you feel this in your body, if anywhere?',
    'What would you want a quieter Tuesday to hold?',
    'Is there a tension you haven’t named yet?',
  ],
  zh: [
    '此刻，这件事里最沉的是什么？',
    '如果今天什么都不用决定，你会先注意到什么？',
    '还有哪一部分感觉没有说完？',
    '如果身体有回应，它落在哪里？',
    '你希望一个更安静的星期二能装下什么？',
    '有没有一个还没被说出的张力？',
  ],
}

export function pickCompanionLine(pool: string[], avoid?: string | null) {
  if (pool.length === 0) return ''
  if (pool.length === 1) return pool[0]
  const options = avoid ? pool.filter((line) => line !== avoid) : pool
  const list = options.length > 0 ? options : pool
  return list[Math.floor(Math.random() * list.length)]!
}
