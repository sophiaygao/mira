/** Client-side Mira reflective engine (no server). */

const EMOTION_CUES = [
  { re: /\banxious|\bworr|\bstress|\bfear|焦虑|担心|压力|害怕/i, label: { en: 'Anxiety', zh: '焦虑' } },
  { re: /\bhope|\bexcit|\beager|希望|期待|兴奋/i, label: { en: 'Hope', zh: '希望' } },
  { re: /\bsad|\bgrief|\blonely|\bempty|难过|悲伤|孤独|空虚/i, label: { en: 'Sadness', zh: '悲伤' } },
  { re: /\bfrustrat|\bang(?:er|ry)\b|\bresen|沮丧|愤怒|怨/i, label: { en: 'Frustration', zh: '沮丧' } },
  { re: /\bconfus|\bunsure|\bstuck|\blost\b|迷茫|不确定|卡住/i, label: { en: 'Uncertainty', zh: '不确定' } },
  { re: /\bjoy|\bgrateful|\bwarm|喜悦|感恩|温暖/i, label: { en: 'Warmth', zh: '温暖' } },
  { re: /\btired|\bexhaust|\boverwhelm|疲惫|耗尽|压垮/i, label: { en: 'Overwhelm', zh: '不堪重负' } },
]

const PILLARS = [
  { id: 'health', en: 'Health', zh: '健康', re: /\bhealth\b|\bbody\b|\benergy\b|\bsleep\b|\bstress\b|健康|身体|睡眠|压力/i },
  { id: 'relationships', en: 'Relationships', zh: '关系', re: /\brelationship|\bfamily\b|\bfriend|\bpartner\b|\blove\b|关系|家人|朋友|伴侣|爱/i },
  { id: 'work', en: 'Work / career', zh: '工作 / 事业', re: /\bwork\b|\bcareer\b|\bjob\b|\bambition|工作|事业|职业|升职/i },
  { id: 'personal_growth', en: 'Personal growth', zh: '个人成长', re: /\bgrowth\b|\blearn|\bcreativ|\bauthent|成长|学习|创造|真实/i },
  { id: 'finances', en: 'Finances', zh: '财务', re: /\bfinanc|\bmoney\b|\bincome\b|\bdebt\b|钱|收入|财务|稳定/i },
  { id: 'lifestyle', en: 'Lifestyle', zh: '生活方式', re: /\blifestyle\b|\bdaily\b|\bhome\b|\bcity\b|生活|日常|城市|家/i },
  { id: 'contribution', en: 'Contribution', zh: '贡献', re: /\bcontribut|\bimpact\b|\blegacy\b|贡献|影响|回馈/i },
  { id: 'spirituality', en: 'Spirituality / meaning', zh: '灵性 / 意义', re: /\bspirit|\bmeaning\b|\bpurpose\b|\bvalues?\b|意义|信仰|目的|价值/i },
]

const QUESTIONS = {
  en: [
    'If there were no one to compare yourself to, would you still want the same version of success?',
    'What if the question isn’t which path is right, but what kind of ordinary Tuesday you want to wake up to?',
    'What would feeling free give you that recognition cannot?',
    'When have you felt most at home — because of where you were, or because of how free you felt to be there?',
    'What if there isn’t a correct life waiting for you — what if you create a life through the choices you make?',
    'What kind of stability would still leave room for you to keep exploring?',
  ],
  zh: [
    '如果没有人可以比较，你还会想要同样版本的成功吗？',
    '如果问题不是哪条路“正确”，而是你更想醒来过怎样的普通周二，那会怎样？',
    '自由感能给你、而认可给不了的是什么？',
    '你何时最有“在家”的感觉——是因为所在的地方，还是因为在那里你可以自由做自己？',
    '如果并没有一个正确的人生在等你——如果你是通过选择去创造生活——那会怎样？',
    '怎样的稳定，仍能给你继续探索的空间？',
  ],
}

const OPENINGS = {
  en: 'I’m here with you. What’s been occupying your thoughts lately?',
  zh: '我在这里陪着你。最近有什么一直占据着你的心思？',
}

function uniq(items) {
  return [...new Set(items)]
}

function pickEmotions(text, locale) {
  return EMOTION_CUES.filter((c) => c.re.test(text)).map((c) => c.label[locale] || c.label.en)
}

function detectValues(text, locale) {
  return PILLARS.filter((p) => p.re.test(text)).map((p) => (locale === 'zh' ? p.zh : p.en))
}

function salt(text) {
  return Math.abs([...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0))
}

export function openingMessage(locale = 'en') {
  return OPENINGS[locale] || OPENINGS.en
}

export function reflect(userText, locale = 'en') {
  const values = detectValues(userText, locale)
  const emotions = pickEmotions(userText, locale)
  const zh = locale === 'zh'
  const qs = QUESTIONS[locale] || QUESTIONS.en

  if (/\b(no[,.]?\s+that'?s not|not really|that'?s not it|不对|不是这样|不是这个意思)\b/i.test(userText)) {
    return zh
      ? `谢谢你纠正这一点。我可能用了一个不太贴合的框架来理解你。\n\n在你自己的感受里，是什么让这件事对你真正有意义？`
      : `Thank you for correcting that. I may have interpreted your words through a lens that doesn’t fit.\n\nWhat is it, in your own sense of this, that feels most true or alive for you?`
  }

  let mirror
  if (zh) {
    if (emotions.includes('焦虑') || emotions.includes('不堪重负')) {
      mirror = `听起来这里有几股力量同时在拉扯——既想要稳住，又害怕被困住。`
    } else if (emotions.includes('悲伤')) {
      mirror = `听起来有一份柔软的伤感想被认真对待，而不是被匆匆略过。`
    } else if (/正确|浪费|选错|right decision/i.test(userText)) {
      mirror = `听起来你把很多重量放在“做对选择”上——仿佛有一个正确的人生在前方等着。`
    } else if (emotions.includes('不确定') || /未来|迷茫|不确定|future|unsure|stuck/i.test(userText)) {
      mirror = `听起来你正站在探索与安定之间的张力里，两边都像在要求你做决定。`
    } else if (values.length > 0) {
      mirror = `听起来你同时在谈几件不同的事：${values.slice(0, 2).join('、')}——它们可能指向不同的渴望。`
    } else {
      mirror = `听起来你正触碰到一些重要的东西。我想先分开听听其中几条线索，而不是急着合成一个答案。`
    }
  } else if (emotions.includes('Anxiety') || emotions.includes('Overwhelm')) {
    mirror = `It sounds like a few forces are pulling at once — a wish to feel steady, and a fear of feeling trapped.`
  } else if (emotions.includes('Sadness')) {
    mirror = `It sounds like there’s a tenderness here that wants to be met carefully, not rushed past.`
  } else if (/right decision|correct (life|path|choice)|waste (my )?time/i.test(userText)) {
    mirror = `It sounds like a lot of weight is resting on making the “right” decision — as if a correct life is waiting somewhere ahead.`
  } else if (emotions.includes('Uncertainty') || /future|don'?t know|unsure|lost|stuck/i.test(userText)) {
    mirror = `It sounds like you’re standing in a tension between exploring and staying rooted — as if choosing one means losing the other.`
  } else if (values.length > 0) {
    mirror = `It sounds like you’re naming more than one desire at once — ${values
      .slice(0, 2)
      .join(' and ')} — and they may not be asking for the same thing.`
  } else {
    mirror = `It sounds like something important is coming into view. I’d rather hold the threads separately than force them into one answer too soon.`
  }

  const question = qs[salt(userText) % qs.length]
  return `${mirror}\n\n${question}`
}

export function mirror(userTexts, locale = 'en') {
  const blob = userTexts.join('\n')
  const values = detectValues(blob, locale)
  const emotions = uniq(pickEmotions(blob, locale)).slice(0, 6)
  const pillarIds = PILLARS.filter((p) => p.re.test(blob)).map((p) => p.id)
  const zh = locale === 'zh'

  const tensions = []
  if (pillarIds.includes('finances') && pillarIds.includes('personal_growth')) {
    tensions.push(zh ? '财务 ↔ 个人成长' : 'Finances ↔ Personal growth')
  }
  if (pillarIds.includes('work') && pillarIds.includes('relationships')) {
    tensions.push(zh ? '工作 ↔ 关系' : 'Work / career ↔ Relationships')
  }
  if (pillarIds.includes('work') && pillarIds.includes('lifestyle')) {
    tensions.push(zh ? '工作 ↔ 生活方式' : 'Work / career ↔ Lifestyle')
  }
  if (!tensions.length && /but|however|vs\.?|但是|可是|一边/i.test(blob)) {
    tensions.push(zh ? '相互拉扯的渴望' : 'Competing desires')
  }

  const summary = []
  if (values.length >= 2) {
    summary.push(
      zh
        ? `听起来我们一次次回到${values[0]}与${values[1]}。`
        : `It sounds like we're returning again and again to ${values[0]} and ${values[1]}.`,
    )
  } else if (values.length === 1) {
    summary.push(
      zh
        ? `听起来${values[0]}是我们分享中安静贯穿的线索。`
        : `It sounds like ${values[0]} is a quiet through-line in what we’ve shared.`,
    )
  }
  if (tensions[0]) {
    summary.push(
      zh
        ? `我们正温柔地持有${tensions[0].replace(' ↔ ', '与')}之间的张力。`
        : `We're holding a tender tension between ${tensions[0].replace(' ↔ ', ' and ')}.`,
    )
  }
  if (emotions[0]) {
    summary.push(
      zh
        ? `${emotions[0]}作为反复出现的情绪基调，贯穿这些反思。`
        : `${emotions[0]} surfaces as a recurring emotional tone across these reflections.`,
    )
  }
  if (!summary.length) {
    summary.push(
      zh
        ? '你的反思仍在汇集——继续下去，模式会更清晰。'
        : 'Your reflections are still gathering — patterns may become clearer as you continue.',
    )
  }

  return {
    values,
    emotions,
    tensions,
    themes: uniq([...values.slice(0, 3), ...emotions.slice(0, 2)]),
    summary_lines: summary,
  }
}

export function pathways(mirrorData, locale = 'en') {
  const v = mirrorData.values.length
    ? mirrorData.values
    : locale === 'zh'
      ? ['个人成长', '关系', '健康']
      : ['Personal growth', 'Relationships', 'Health']
  const [primary, secondary, tertiary] = [v[0], v[1] || v[0], v[2] || v[0]]
  const zh = locale === 'zh'

  if (zh) {
    return [
      {
        title: `以${primary}为中心的生活`,
        description: `在这个可能的未来里，${primary}成为更稳定的组织原则。日子少一些被迫，多一些与你已说出的渴望对齐的选择。`,
        values: [primary, secondary],
        opportunities: [`日常选择与${primary}更深的一致`, '更清晰的自我作者感'],
        tradeoffs: ['一些熟悉的路或许不再那么可得', '他人可能需要时间理解这个转变'],
      },
      {
        title: `同时持有${secondary}与${tertiary}`,
        description: `这个未来不急着选边。它试着同时承载${secondary}与${tertiary}——有时不均衡，却常常是有意的。`,
        values: [secondary, tertiary, primary],
        opportunities: ['允许多种真实并存', '在张力中前行而不强求闭合'],
        tradeoffs: ['比单轨路径更少确定性', '需要持续重新协商优先事项'],
      },
      {
        title: '更慢、更宽敞的一章',
        description:
          '这里的近期未来强调呼吸与容量。野心稍稍柔软，好让身体、关系与那些被挤走的安静信号重新被听见。',
        values: uniq([tertiary, '健康', primary]),
        opportunities: ['恢复注意力与情绪带宽', '更清楚什么想要下一步生长'],
        tradeoffs: ['外在里程碑可能更慢', '若速度曾意味着安全，这会感到陌生'],
      },
    ]
  }

  return [
    {
      title: `A life centered on ${String(primary).toLowerCase()}`,
      description: `In this possible future, ${String(primary).toLowerCase()} becomes a steadier organizing principle. Days are shaped less by obligation and more by choices aligned with what you’ve been naming.`,
      values: [primary, secondary],
      opportunities: [
        `Deeper congruence with ${String(primary).toLowerCase()}`,
        'A clearer sense of personal authorship',
      ],
      tradeoffs: ['Some familiar paths may feel less available', 'Others may need time to understand the shift'],
    },
    {
      title: `Holding ${String(secondary).toLowerCase()} beside ${String(tertiary).toLowerCase()}`,
      description: `This future doesn’t pick a single pole. It experiments with carrying both at once — sometimes unevenly, often intentionally.`,
      values: [secondary, tertiary, primary],
      opportunities: ['Room for multiple truths to coexist', 'Skill in navigating tension without forcing closure'],
      tradeoffs: ['Less certainty than a single-track path', 'Requires ongoing renegotiation of priorities'],
    },
    {
      title: 'A slower, spacious chapter',
      description:
        'Here the near future emphasizes breath and capacity. Ambition softens just enough for listening — to your body, your relationships, and quieter signals.',
      values: uniq([tertiary, 'Health', primary]),
      opportunities: ['Recovered attention and emotional bandwidth', 'Clearer signals about what wants to grow next'],
      tradeoffs: ['External milestones may move more slowly', 'May feel unfamiliar if pace has meant safety'],
    },
  ]
}

export function countItems(sessions, key) {
  const map = new Map()
  for (const s of sessions) {
    const list = s.mirror?.[key] || []
    for (const item of list) {
      map.set(item, (map.get(item) || 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
