import type { Locale } from '@/lib/i18n/translations'

/** Soft first questions — future / what matters, varied each session. */

const OPENINGS_EN = [
  'As we begin, what feels most important for you to understand about the life you want ahead?',
  'Looking gently forward, what do you hope your future holds — even if it’s still unclear?',
  'What feels most worth protecting or growing in your life right now?',
  'If we start from what matters to you, what comes up first?',
  'What kind of life are you quietly hoping to grow into?',
  'When you imagine a future that feels true to you, what stands out?',
  'What do you want more of for yourself in the seasons ahead?',
  'What feels alive for you when you think about who you’re becoming?',
  'Without needing a finished plan — what feels important to you these days?',
  'What would you like your future self to thank you for noticing today?',
  'As we sit with this together, what do you most want for yourself going forward?',
  'What values or hopes feel closest to the surface right now?',
]

const OPENINGS_ZH = [
  '我们开始时，关于你想要的人生，什么是你最想先弄清楚的？',
  '轻轻望向前面，你希望未来里有什么——哪怕它还不清楚？',
  '此刻，你生命里什么是最值得守护或慢慢生长的？',
  '如果从“对你重要的事”开始，最先浮现的是什么？',
  '你悄悄希望自己长成怎样的一种生活？',
  '当你想象一个对你真实的未来，什么最突出？',
  '在接下来的日子里，你想为自己多留一些什么？',
  '想到自己正在成为的人，什么感觉还活着？',
  '不必先有完整计划——这些日子里，什么对你重要？',
  '你希望未来的自己，感谢你今天留意到了什么？',
  '我们一起坐在这里时，你最想为自己要到什么？',
  '此刻，哪些价值或希望离你最近？',
]

export function pickOpeningPrompt(locale: Locale = 'en') {
  const pool = locale === 'zh' ? OPENINGS_ZH : OPENINGS_EN
  return pool[Math.floor(Math.random() * pool.length)]!
}
