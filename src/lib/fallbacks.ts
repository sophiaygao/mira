import type { MirrorInsight, Pathway } from './types'
import { detectPillarsFromText, normalizeToPillarLabels } from './pillars'
import type { Locale } from '@/lib/i18n/translations'

const EMOTION_CUES: { re: RegExp; label: string }[] = [
  { re: /\banxious|\bworr|\bstress|\bfear/i, label: 'Anxiety' },
  { re: /\bhope|\bexcit|\beager/i, label: 'Hope' },
  { re: /\bsad|\bgrief|\blonely|\bempty/i, label: 'Sadness' },
  { re: /\bfrustrat|\bang(?:er|ry)\b|\bresen/i, label: 'Frustration' },
  { re: /\bconfus|\bunsure|\bstuck|\blost\b/i, label: 'Uncertainty' },
  { re: /\bjoy|\bgrateful|\bwarm/i, label: 'Warmth' },
  { re: /\btired|\bexhaust|\boverwhelm/i, label: 'Overwhelm' },
]

function uniq(items: string[]) {
  return [...new Set(items)]
}

function pickLabels(text: string, cues: { re: RegExp; label: string }[]) {
  return cues.filter((c) => c.re.test(text)).map((c) => c.label)
}

const DEEP_QUESTIONS_EN = [
  'If there were no one to compare yourself to, would you still want the same version of success?',
  'What if the question isn’t which path is right, but what kind of ordinary Tuesday you want to wake up to?',
  'What would feeling free give you that recognition cannot?',
  'When have you felt most at home — because of where you were, or because of how free you felt to be there?',
  'What if there isn’t a correct life waiting for you — what if you create a life through the choices you make?',
  'What kind of stability would still leave room for you to keep exploring?',
]

const DEEP_QUESTIONS_ZH = [
  '如果没有人可以比较，你还会想要同样版本的成功吗？',
  '如果问题不是哪条路“正确”，而是你更想醒来过怎样的普通周二，那会怎样？',
  '自由感能给你、而认可给不了的是什么？',
  '你何时最有“在家”的感觉——是因为所在的地方，还是因为在那里你可以自由做自己？',
  '如果并没有一个正确的人生在等你——如果你是通过选择去创造生活——那会怎样？',
  '怎样的稳定，仍能给你继续探索的空间？',
]

export function fallbackReflect(
  userText: string,
  remainingSeed?: string,
  locale: Locale = 'en',
): string {
  const values = normalizeToPillarLabels([], userText)
  const emotions = pickLabels(userText, EMOTION_CUES)
  const salt = Math.abs(
    [...userText].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
  )
  const zh = locale === 'zh'
  const qs = zh ? DEEP_QUESTIONS_ZH : DEEP_QUESTIONS_EN

  const isCorrection =
    /\b(no[,.]?\s+that'?s not|not really|that'?s not it|you'?re wrong|不对|不是这样|不是这个意思|你理解错了)\b/i.test(
      userText,
    )

  if (isCorrection) {
    return zh
      ? `谢谢你纠正这一点。我可能用了一个不太贴合的框架来理解你。\n\n在你自己的感受里，是什么让这件事对你真正有意义？`
      : `Thank you for correcting that. I may have interpreted your words through a lens that doesn’t fit.\n\nWhat is it, in your own sense of this, that feels most true or alive for you?`
  }

  const mirror = zh
    ? emotions.includes('Anxiety') || emotions.includes('Overwhelm')
      ? `听起来这里有几股力量同时在拉扯——既想要稳住，又害怕被困住。`
      : emotions.includes('Sadness')
        ? `听起来有一份柔软的伤感想被认真对待，而不是被匆匆略过。`
        : /right decision|correct|waste|正确|浪费|选错/i.test(userText)
          ? `听起来你把很多重量放在“做对选择”上——仿佛有一个正确的人生在前方等着。`
          : emotions.includes('Uncertainty') ||
              /future|don'?t know|unsure|lost|stuck|未来|迷茫|不确定/i.test(userText)
            ? `听起来你正站在探索与安定之间的张力里，两边都像在要求你做决定。`
            : values.length > 0
              ? `听起来你同时在谈几件不同的事：${values.slice(0, 2).join('、')}——它们可能指向不同的渴望。`
              : `听起来你正触碰到一些重要的东西。我想先分开听听其中几条线索，而不是急着合成一个答案。`
    : emotions.includes('Anxiety') || emotions.includes('Overwhelm')
      ? `It sounds like a few forces are pulling at once — a wish to feel steady, and a fear of feeling trapped.`
      : emotions.includes('Sadness')
        ? `It sounds like there’s a tenderness here that wants to be met carefully, not rushed past.`
        : /right decision|correct (life|path|choice)|waste (my )?time/i.test(userText)
          ? `It sounds like a lot of weight is resting on making the “right” decision — as if a correct life is waiting somewhere ahead.`
          : emotions.includes('Uncertainty') || /future|don'?t know|unsure|lost|stuck/i.test(userText)
            ? `It sounds like you’re standing in a tension between exploring and staying rooted — as if choosing one means losing the other.`
            : values.includes('Work / career') && values.includes('Personal growth')
              ? `It sounds like there may be a few different longings braided together here — steadiness, growth, and how you want ordinary days to feel.`
              : values.length > 0
                ? `It sounds like you’re naming more than one desire at once — ${values
                    .slice(0, 2)
                    .join(' and ')} — and they may not be asking for the same thing.`
                : `It sounds like something important is coming into view. I’d rather hold the threads separately than force them into one answer too soon.`

  const under = zh
    ? /judg|enough|fail|behind|比较|落后|不够|害怕/i.test(userText)
      ? ` 在“落后”或不够好的感觉里，也许还有对自由与被看见的双重需要。`
      : /trap|stuck|permanent|困住|永久|稳定/i.test(userText)
        ? ` 也许让你抗拒的，不完全是稳定本身，而是没有选择余地的固定。`
        : ''
    : /judg|enough|fail|behind|compar/i.test(userText)
      ? ` Inside the feeling of being “behind,” there may be both a wish for freedom and a wish to be seen.`
      : /trap|stuck|permanent|stability/i.test(userText)
        ? ` What you’re resisting may not be stability itself, but permanence without choice.`
        : ''

  const question =
    remainingSeed?.startsWith('What') ||
    remainingSeed?.startsWith('If') ||
    remainingSeed?.startsWith('When') ||
    remainingSeed?.startsWith('如果') ||
    remainingSeed?.startsWith('怎样') ||
    remainingSeed?.startsWith('你何时')
      ? remainingSeed
      : remainingSeed
        ? zh
          ? `如果从你刚才说的继续看——${remainingSeed}`
          : `If we stay with what you just named — ${remainingSeed.charAt(0).toLowerCase()}${remainingSeed.slice(1)}`
        : qs[salt % qs.length]

  return `${mirror}${under}\n\n${question}`
}

export function fallbackMirror(
  sessionId: string,
  userTexts: string[],
  locale: Locale = 'en',
): Omit<MirrorInsight, 'id' | 'created_at'> {
  const blob = userTexts.join('\n')
  const values = normalizeToPillarLabels([], blob)
  const emotions = uniq(pickLabels(blob, EMOTION_CUES)).slice(0, 6)
  const pillarIds = detectPillarsFromText(blob)

  const tensions: string[] = []
  if (pillarIds.includes('finances') && pillarIds.includes('personal_growth')) {
    tensions.push('Finances ↔ Personal growth')
  }
  if (pillarIds.includes('work') && pillarIds.includes('relationships')) {
    tensions.push('Work / career ↔ Relationships')
  }
  if (pillarIds.includes('work') && pillarIds.includes('lifestyle')) {
    tensions.push('Work / career ↔ Lifestyle')
  }
  if (pillarIds.includes('health') && (pillarIds.includes('work') || pillarIds.includes('contribution'))) {
    tensions.push('Health ↔ Demand')
  }
  if (!tensions.length && /but|however|vs\.?|versus|between/i.test(blob)) {
    tensions.push('Competing desires')
  }

  const zh = locale === 'zh'
  const motivations = values
    .slice(0, 3)
    .map((v) => (zh ? `朝向更多${v}` : `Moving toward more ${v.toLowerCase()}`))

  const themes = uniq([
    ...values.slice(0, 3),
    ...emotions.slice(0, 2),
    ...(tensions.length ? [zh ? '内在张力' : 'Inner tension'] : []),
  ])

  const summary_lines: string[] = []
  if (values.length >= 2) {
    summary_lines.push(
      zh
        ? `听起来我们一次次回到${values[0]}与${values[1]}。`
        : `It sounds like we're returning again and again to ${values[0]} and ${values[1]}.`,
    )
  } else if (values.length === 1) {
    summary_lines.push(
      zh
        ? `听起来${values[0]}是我们分享中安静贯穿的线索。`
        : `It sounds like ${values[0]} is a quiet through-line in what we’ve shared.`,
    )
  }
  if (tensions[0]) {
    summary_lines.push(
      zh
        ? `我们正温柔地持有${tensions[0].replace(' ↔ ', '与')}之间的张力。`
        : `We're holding a tender tension between ${tensions[0].replace(' ↔ ', ' and ')}.`,
    )
  }
  if (emotions[0]) {
    summary_lines.push(
      zh
        ? `${emotions[0]}作为反复出现的情绪基调，贯穿这些反思。`
        : `${emotions[0]} surfaces as a recurring emotional tone across these reflections.`,
    )
  }
  if (!summary_lines.length) {
    summary_lines.push(
      zh
        ? '你的反思仍在汇集——继续下去，模式会更清晰。'
        : 'Your reflections are still gathering — patterns may become clearer as you continue.',
    )
  }

  return {
    session_id: sessionId,
    values,
    motivations,
    tensions,
    emotions,
    themes,
    summary_lines,
    raw: { source: 'fallback' },
  }
}

export function fallbackPathways(
  sessionId: string,
  mirror: Pick<MirrorInsight, 'values' | 'tensions' | 'themes'>,
  locale: Locale = 'en',
): Omit<Pathway, 'id' | 'created_at'>[] {
  const v = mirror.values.length
    ? mirror.values
    : ['Personal growth', 'Relationships', 'Health']
  const primary = v[0] || 'Personal growth'
  const secondary = v[1] || 'Relationships'
  const tertiary = v[2] || 'Health'
  const zh = locale === 'zh'

  const base = zh
    ? [
        {
          title: `以${primary}为中心的生活`,
          description: `在这个可能的未来里，${primary}成为更稳定的组织原则。日子少一些被迫，多一些与你已说出的渴望对齐的选择。日常生活的质地，会慢慢围绕这个中心重新安排。`,
          values: [primary, secondary].filter(Boolean),
          opportunities: [`日常选择与${primary}更深的一致`, '更清晰的自我作者感'],
          tradeoffs: ['一些熟悉的路或许不再那么可得', '他人可能需要时间理解这个转变'],
          sort_order: 0,
        },
        {
          title: `同时持有${secondary}与${tertiary}`,
          description: `这个未来不急着选边。它试着同时承载${secondary}与${tertiary}——有时不均衡，却常常是有意的。进展更像整合，而不是一次解决。`,
          values: [secondary, tertiary, primary].filter(Boolean),
          opportunities: ['允许多种真实并存', '在张力中前行而不强求闭合'],
          tradeoffs: ['比单轨路径更少确定性', '需要持续重新协商优先事项'],
          sort_order: 1,
        },
        {
          title: '更慢、更宽敞的一章',
          description:
            '这里的近期未来强调呼吸与容量。野心稍稍柔软，好让身体、关系与那些被挤走的安静信号重新被听见。方向仍重要；紧迫感松开了手。',
          values: uniq([tertiary, 'Health', primary]),
          opportunities: ['恢复注意力与情绪带宽', '更清楚什么想要下一步生长'],
          tradeoffs: ['外在里程碑可能更慢', '若速度曾意味着安全，这会感到陌生'],
          sort_order: 2,
        },
      ]
    : [
        {
          title: `A life centered on ${primary.toLowerCase()}`,
          description: `In this possible future, ${primary.toLowerCase()} becomes a steadier organizing principle. Days are shaped less by obligation and more by choices that feel aligned with what you’ve been naming. The texture of ordinary life slowly rearranges around that center.`,
          values: [primary, secondary].filter(Boolean),
          opportunities: [
            `Deeper congruence between daily choices and ${primary.toLowerCase()}`,
            'A clearer sense of personal authorship',
          ],
          tradeoffs: [
            'Some familiar paths may feel less available',
            'Others may need time to understand the shift',
          ],
          sort_order: 0,
        },
        {
          title: `Holding ${secondary.toLowerCase()} beside ${tertiary.toLowerCase()}`,
          description: `This future doesn’t pick a single pole. It experiments with carrying ${secondary.toLowerCase()} and ${tertiary.toLowerCase()} at once — sometimes unevenly, often intentionally. Progress looks like integration rather than resolution.`,
          values: [secondary, tertiary, primary].filter(Boolean),
          opportunities: [
            'Room for multiple truths to coexist',
            'Skill in navigating tension without forcing closure',
          ],
          tradeoffs: [
            'Less certainty than a single-track path',
            'Requires ongoing renegotiation of priorities',
          ],
          sort_order: 1,
        },
        {
          title: 'A slower, spacious chapter',
          description:
            'Here the near future emphasizes breath and capacity. Ambition softens just enough for listening — to your body, your relationships, and the quieter signals that get crowded out. Direction still matters; urgency loosens its grip.',
          values: uniq([tertiary, 'Health', primary]),
          opportunities: [
            'Recovered attention and emotional bandwidth',
            'Clearer signals about what wants to grow next',
          ],
          tradeoffs: [
            'External milestones may move more slowly',
            'May feel unfamiliar if pace has meant safety',
          ],
          sort_order: 2,
        },
      ]

  return base.map((p) => ({ ...p, session_id: sessionId }))
}
