import { openingMessage, reflect, mirror, pathways, countItems } from './mira-engine.js'

const STORE_KEY = 'mira_static_v1'
const uid = () => crypto.randomUUID()

const i18n = {
  en: {
    navHome: 'Home',
    navReflect: 'Reflect',
    navFutures: 'Futures',
    navDashboard: 'Dashboard',
    navHistory: 'History',
    navPlans: 'Plans',
    homeHeadline: 'Explore the futures you might grow into.',
    homeSub: 'Reflect. Discover your values. Imagine more than one possible path — without being told which to take.',
    homeBegin: 'Begin reflection',
    homePlans: 'View plans',
    homeDisclaimer: 'Mira is a reflective companion, not a therapist or crisis service. If you’re in danger, seek immediate local help (US: 988).',
    sessionEyebrow: 'Reflection session',
    sessionTitle: 'Take a breath, and begin.',
    sessionSub: 'Mira listens and asks gentle follow-ups as we reflect together.',
    writeFreely: 'Write freely...',
    keepGoing: 'We can keep going, or finish when we feel ready.',
    you: 'You',
    mira: 'Mira',
    seePatterns: 'See my patterns',
    imagineFutures: 'Imagine futures',
    mirrorTitle: 'What keeps returning',
    mirrorSub: 'Patterns drawn from your words — not advice, not a verdict.',
    values: 'Values',
    emotions: 'Emotions',
    tensions: 'Tensions',
    themes: 'Themes',
    pathwaysTitle: 'Three possible futures',
    pathwaysSub: 'Unranked alternatives — possibilities to sit with, not a recommended path.',
    opportunities: 'Opportunities',
    tradeoffs: 'Tradeoffs',
    needReflection: 'Share a little in the reflection first, then we can imagine futures together.',
    dashTitle: 'Your inner map',
    dashSub: 'Recurring values, emotions, and themes from this browser’s reflections.',
    sessions: 'Sessions',
    themesMirrored: 'Themes mirrored',
    pathwaysImagined: 'Pathways imagined',
    emptyDash: 'Begin a reflection to light up this map.',
    historyTitle: 'Revisit reflections',
    historySub: 'Sessions saved in this browser only.',
    noHistory: 'No reflections yet.',
    open: 'Open',
    plansTitle: 'Simple plans, softer prices',
    plansSub: 'Reflect without a premium wall. Upgrade only when you want more room to go deeper.',
    uploadAvatar: 'Upload companion photo',
    clearData: 'Clear local data',
    cleared: 'Local Mira data cleared.',
  },
  zh: {
    navHome: '首页',
    navReflect: '反思',
    navFutures: '未来',
    navDashboard: '仪表盘',
    navHistory: '历史',
    navPlans: '方案',
    homeHeadline: '探索你可能成长进入的未来。',
    homeSub: '反思。发现你的价值。想象不止一条可能的路——而不是被告诉该走哪一条。',
    homeBegin: '开始反思',
    homePlans: '查看方案',
    homeDisclaimer: 'Mira 是一位反思伙伴，不是治疗师或危机服务。若你处于危险中，请立即寻求当地帮助（美国：988）。',
    sessionEyebrow: '反思会话',
    sessionTitle: '先深呼吸，然后开始。',
    sessionSub: 'Mira 会倾听，并在我们一同反思时提出温柔的追问。',
    writeFreely: '自由书写…',
    keepGoing: '我们可以继续，也可以在准备好时停下来。',
    you: '你',
    mira: 'Mira',
    seePatterns: '看看我的模式',
    imagineFutures: '想象未来',
    mirrorTitle: '反复出现的内容',
    mirrorSub: '来自你话语中的模式——不是建议，也不是裁决。',
    values: '价值',
    emotions: '情绪',
    tensions: '张力',
    themes: '主题',
    pathwaysTitle: '三种可能的未来',
    pathwaysSub: '未排序的备选——是可以并肩坐下来感受的可能，而不是推荐答案。',
    opportunities: '机遇',
    tradeoffs: '取舍',
    needReflection: '先在反思里写一点，我们再一起想象未来。',
    dashTitle: '你的内在地图',
    dashSub: '来自此浏览器中反思的反复价值、情绪与主题。',
    sessions: '会话',
    themesMirrored: '已映照主题',
    pathwaysImagined: '已想象路径',
    emptyDash: '开始一次反思，点亮这张地图。',
    historyTitle: '回看反思',
    historySub: '仅保存在此浏览器中。',
    noHistory: '还没有反思。',
    open: '打开',
    plansTitle: '简单方案，更柔和的价格',
    plansSub: '不必被付费墙拦住反思。只有当你想走得更深时，再升级。',
    uploadAvatar: '上传陪伴照片',
    clearData: '清空本地数据',
    cleared: '本地 Mira 数据已清空。',
  },
}

const state = {
  locale: 'en',
  route: 'home',
  store: loadStore(),
  sessionId: null,
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '') || defaultStore()
  } catch {
    return defaultStore()
  }
}

function defaultStore() {
  return { sessions: [], avatarDataUrl: null }
}

function saveStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.store))
}

function t(key) {
  return i18n[state.locale][key] || i18n.en[key] || key
}

function currentSession() {
  return state.store.sessions.find((s) => s.id === state.sessionId) || null
}

function ensureSession() {
  let s = currentSession()
  if (s) return s
  s = {
    id: uid(),
    title: state.locale === 'zh' ? '反思' : 'Reflection',
    createdAt: new Date().toISOString(),
    messages: [
      { id: uid(), role: 'mira', content: openingMessage(state.locale) },
    ],
    mirror: null,
    pathways: [],
  }
  state.store.sessions.unshift(s)
  state.sessionId = s.id
  saveStore()
  return s
}

function navigate(route, sessionId) {
  state.route = route
  if (sessionId) state.sessionId = sessionId
  location.hash = sessionId ? `#${route}/${sessionId}` : `#${route}`
  render()
}

function parseHash() {
  const raw = (location.hash || '#home').slice(1)
  const [route, id] = raw.split('/')
  state.route = route || 'home'
  if (id) state.sessionId = id
}

function el(html) {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild
}

function markSvg(cls = '') {
  return `<svg class="${cls}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="27" stroke="currentColor" stroke-width="1" opacity="0.35"/>
    <circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="2.25" opacity="0.72"/>
    <circle cx="32" cy="32" r="18" fill="currentColor" opacity="0.12"/>
    <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.55"/>
  </svg>`
}

function chips(items) {
  if (!items?.length) return ''
  return `<div class="chips">${items.map((i) => `<span class="chip">${escapeHtml(i)}</span>`).join('')}</div>`
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderNav() {
  const links = [
    ['home', 'navHome'],
    ['reflect', 'navReflect'],
    ['futures', 'navFutures'],
    ['dashboard', 'navDashboard'],
    ['history', 'navHistory'],
    ['plans', 'navPlans'],
  ]
  const avatar = state.store.avatarDataUrl
  return `
    <header class="topnav">
      <a href="#home" class="brand" data-nav="home">${markSvg()} Mira</a>
      <nav class="nav-links">
        ${links
          .map(
            ([r, k]) =>
              `<a href="#${r}" class="${state.route === r ? 'active' : ''}" data-nav="${r}">${t(k)}</a>`,
          )
          .join('')}
      </nav>
      <div class="nav-right">
        <button class="avatar-btn" id="avatarBtn" title="${t('uploadAvatar')}" aria-label="${t('uploadAvatar')}">
          ${avatar ? `<img src="${avatar}" alt="">` : markSvg()}
        </button>
        <input id="avatarInput" type="file" accept="image/*" class="hidden" />
        <button class="lang-toggle" id="langBtn">${state.locale === 'en' ? '中文' : 'EN'}</button>
      </div>
    </header>
  `
}

function viewHome() {
  return `
    <section class="hero">
      ${markSvg('mark')}
      <h1>Mira</h1>
      <p class="editorial">${t('homeHeadline')}</p>
      <p class="sub">${t('homeSub')}</p>
      <div class="actions">
        <button class="btn btn-primary" data-nav="reflect">${t('homeBegin')}</button>
        <button class="btn btn-secondary" data-nav="plans">${t('homePlans')}</button>
      </div>
      <p class="disclaimer">${t('homeDisclaimer')}</p>
    </section>
  `
}

function viewReflect() {
  const s = ensureSession()
  const userCount = s.messages.filter((m) => m.role === 'user').length
  return `
    <div class="page-head">
      <p class="eyebrow">${t('sessionEyebrow')}</p>
      <h1>${t('sessionTitle')}</h1>
      <p>${t('sessionSub')}</p>
    </div>
    <div class="chat-log" id="chatLog">
      ${s.messages
        .map(
          (m) => `
        <article class="msg ${m.role}">
          <span class="who">${m.role === 'user' ? t('you') : t('mira')}</span>
          <div class="bubble">${escapeHtml(m.content)}</div>
        </article>`,
        )
        .join('')}
    </div>
    <form class="panel composer" id="chatForm">
      <textarea id="draft" rows="1" placeholder="${t('writeFreely')}" aria-label="${t('writeFreely')}"></textarea>
      <button class="send" type="submit" aria-label="Send">→</button>
    </form>
    <p class="sub" style="text-align:center;margin-top:0.6rem">${t('keepGoing')}</p>
    <div class="session-actions">
      <button class="btn btn-secondary" id="btnMirror" ${userCount < 1 ? 'disabled' : ''}>${t('seePatterns')}</button>
      <button class="btn btn-secondary" id="btnFutures" ${userCount < 1 ? 'disabled' : ''}>${t('imagineFutures')}</button>
    </div>
    ${
      s.mirror
        ? `<section class="panel" style="margin-top:1rem">
            <h2 style="margin:0;color:var(--forest);font-weight:500">${t('mirrorTitle')}</h2>
            <p class="sub" style="margin-top:0.35rem">${t('mirrorSub')}</p>
            <ul style="margin:0.85rem 0 0;padding-left:1rem;line-height:1.55">
              ${s.mirror.summary_lines.map((l) => `<li class="editorial" style="margin-top:0.4rem;max-width:none">${escapeHtml(l)}</li>`).join('')}
            </ul>
            <p class="meta" style="margin-top:0.85rem;font-size:0.75rem;color:var(--ink-soft)">${t('values')}</p>
            ${chips(s.mirror.values)}
            <p class="meta" style="margin-top:0.65rem;font-size:0.75rem;color:var(--ink-soft)">${t('emotions')}</p>
            ${chips(s.mirror.emotions)}
            <p class="meta" style="margin-top:0.65rem;font-size:0.75rem;color:var(--ink-soft)">${t('tensions')}</p>
            ${chips(s.mirror.tensions)}
          </section>`
        : ''
    }
  `
}

function viewFutures() {
  const s = currentSession() || ensureSession()
  const userCount = s.messages.filter((m) => m.role === 'user').length
  if (userCount < 1) {
    return `
      <div class="page-head">
        <h1>${t('pathwaysTitle')}</h1>
        <p>${t('needReflection')}</p>
      </div>
      <button class="btn btn-primary" data-nav="reflect">${t('homeBegin')}</button>
    `
  }
  if (!s.pathways?.length) {
    if (!s.mirror) {
      const texts = s.messages.filter((m) => m.role === 'user').map((m) => m.content)
      s.mirror = mirror(texts, state.locale)
    }
    s.pathways = pathways(s.mirror, state.locale)
    saveStore()
  }
  return `
    <div class="page-head">
      <h1>${t('pathwaysTitle')}</h1>
      <p>${t('pathwaysSub')}</p>
    </div>
    <div class="grid-3">
      ${s.pathways
        .map(
          (p) => `
        <article class="panel pathway">
          <h3>${escapeHtml(p.title)}</h3>
          <p class="desc">${escapeHtml(p.description)}</p>
          <p class="meta">${t('values')}</p>
          ${chips(p.values)}
          <p class="meta">${t('opportunities')}</p>
          <ul>${p.opportunities.map((o) => `<li>· ${escapeHtml(o)}</li>`).join('')}</ul>
          <p class="meta">${t('tradeoffs')}</p>
          <ul>${p.tradeoffs.map((o) => `<li>· ${escapeHtml(o)}</li>`).join('')}</ul>
        </article>`,
        )
        .join('')}
    </div>
  `
}

function viewDashboard() {
  const sessions = state.store.sessions
  const withMirror = sessions.filter((s) => s.mirror)
  const emotions = countItems(withMirror, 'emotions')
  const themes = countItems(withMirror, 'themes')
  const tensions = countItems(withMirror, 'tensions')
  const pathwayCount = sessions.reduce((n, s) => n + (s.pathways?.length || 0), 0)
  const palette = ['#344f46', '#789387', '#9992b2', '#d9a995', '#5f756c', '#8a849e']

  function bloom(items) {
    if (!items.length) return `<p class="sub">${t('emptyDash')}</p>`
    const max = Math.max(...items.map((i) => i.count))
    return `<div class="bloom">${items
      .slice(0, 8)
      .map((item, i) => {
        const size = 52 + (item.count / max) * 48
        return `<div class="orb" style="width:${size}px;height:${size}px;background:${palette[i % palette.length]}">
          <span>${escapeHtml(item.name)}<small>×${item.count}</small></span>
        </div>`
      })
      .join('')}</div>`
  }

  return `
    <div class="page-head">
      <h1>${t('dashTitle')}</h1>
      <p>${t('dashSub')}</p>
    </div>
    <div class="stat-row">
      <div class="panel stat"><p class="eyebrow">${t('sessions')}</p><p class="num">${sessions.length}</p></div>
      <div class="panel stat"><p class="eyebrow">${t('themesMirrored')}</p><p class="num">${themes.length}</p></div>
      <div class="panel stat"><p class="eyebrow">${t('pathwaysImagined')}</p><p class="num">${pathwayCount}</p></div>
    </div>
    <div class="panel" style="margin-bottom:0.85rem">
      <h2 style="margin:0;font-size:1.15rem;color:var(--forest);font-weight:500">${t('emotions')}</h2>
      ${bloom(emotions)}
    </div>
    <div class="panel" style="margin-bottom:0.85rem">
      <h2 style="margin:0;font-size:1.15rem;color:var(--forest);font-weight:500">${t('themes')}</h2>
      ${bloom(themes)}
    </div>
    <div class="panel">
      <h2 style="margin:0;font-size:1.15rem;color:var(--forest);font-weight:500">${t('tensions')}</h2>
      ${bloom(tensions)}
    </div>
  `
}

function viewHistory() {
  const sessions = state.store.sessions
  return `
    <div class="page-head">
      <h1>${t('historyTitle')}</h1>
      <p>${t('historySub')}</p>
    </div>
    ${
      !sessions.length
        ? `<p class="sub">${t('noHistory')}</p>`
        : `<div class="history-list">${sessions
            .map(
              (s) => `
          <a class="panel history-item" href="#reflect/${s.id}" data-open="${s.id}">
            <span>${escapeHtml(s.title)} · ${s.messages.filter((m) => m.role === 'user').length} ${state.locale === 'zh' ? '条' : 'notes'}</span>
            <time>${new Date(s.createdAt).toLocaleDateString()}</time>
          </a>`,
            )
            .join('')}</div>`
    }
    <div style="margin-top:1rem">
      <button class="btn-ghost" id="clearData">${t('clearData')}</button>
    </div>
  `
}

function viewPlans() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      blurb: state.locale === 'zh' ? '安静地开始反思。' : 'A quiet place to begin reflecting.',
      features:
        state.locale === 'zh'
          ? ['引导式反思对话', '陪伴头像', '模式映照', '三种未来路径']
          : ['Guided reflective chat', 'Companion photo', 'Pattern mirror', 'Three future pathways'],
    },
    {
      name: 'Plus',
      price: '$6',
      featured: true,
      blurb: state.locale === 'zh' ? '日常反思，走得更深一点。' : 'More depth for everyday reflection.',
      features:
        state.locale === 'zh'
          ? ['包含免费版', '无限反思', '更丰富仪表盘', '优先体验']
          : ['Everything in Free', 'Unlimited reflections', 'Richer dashboard', 'Priority access'],
    },
    {
      name: 'Deep',
      price: '$12',
      blurb: state.locale === 'zh' ? '适合认真自我探询的阶段。' : 'For seasons of serious self-inquiry.',
      features:
        state.locale === 'zh'
          ? ['包含 Plus', '更长记忆', '进阶地图', '优先支持']
          : ['Everything in Plus', 'Longer memory', 'Advanced maps', 'Priority support'],
    },
  ]
  return `
    <div class="page-head" style="text-align:center">
      <h1>${t('plansTitle')}</h1>
      <p>${t('plansSub')}</p>
    </div>
    <div class="grid-3 plans">
      ${plans
        .map(
          (p) => `
        <article class="panel plan ${p.featured ? 'featured' : ''}">
          ${p.featured ? `<span class="badge">${state.locale === 'zh' ? '最受喜爱' : 'Most loved'}</span>` : ''}
          <h3 style="margin:0;color:var(--forest);font-weight:500;font-size:1.35rem">${p.name}</h3>
          <p class="sub" style="margin-top:0.35rem">${p.blurb}</p>
          <p class="price">${p.price} <span>/mo</span></p>
          <ul style="list-style:none;padding:0;margin:1rem 0 0">
            ${p.features.map((f) => `<li style="margin-top:0.4rem">✓ ${escapeHtml(f)}</li>`).join('')}
          </ul>
        </article>`,
        )
        .join('')}
    </div>
  `
}

function renderPet() {
  const pet = document.getElementById('pet')
  if (!pet) return
  if (state.store.avatarDataUrl) {
    pet.innerHTML = `<img src="${state.store.avatarDataUrl}" alt="">`
    pet.classList.remove('hidden')
  } else {
    pet.classList.add('hidden')
    pet.innerHTML = ''
  }
}

function render() {
  document.documentElement.lang = state.locale === 'zh' ? 'zh-CN' : 'en'
  const root = document.getElementById('app')
  const views = {
    home: viewHome,
    reflect: viewReflect,
    futures: viewFutures,
    dashboard: viewDashboard,
    history: viewHistory,
    plans: viewPlans,
  }
  const body = (views[state.route] || viewHome)()
  root.innerHTML = `${renderNav()}<main class="view">${body}</main>`
  renderPet()
  bind()
  const log = document.getElementById('chatLog')
  if (log) log.scrollTop = log.scrollHeight
}

function bind() {
  document.querySelectorAll('[data-nav]').forEach((node) => {
    node.addEventListener('click', (e) => {
      e.preventDefault()
      const route = node.getAttribute('data-nav')
      if (route === 'reflect' && !state.sessionId) ensureSession()
      navigate(route, route === 'reflect' ? state.sessionId : undefined)
    })
  })

  document.querySelectorAll('[data-open]').forEach((node) => {
    node.addEventListener('click', (e) => {
      e.preventDefault()
      navigate('reflect', node.getAttribute('data-open'))
    })
  })

  document.getElementById('langBtn')?.addEventListener('click', () => {
    state.locale = state.locale === 'en' ? 'zh' : 'en'
    render()
  })

  const avatarBtn = document.getElementById('avatarBtn')
  const avatarInput = document.getElementById('avatarInput')
  avatarBtn?.addEventListener('click', () => avatarInput?.click())
  avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      state.store.avatarDataUrl = String(reader.result)
      saveStore()
      render()
    }
    reader.readAsDataURL(file)
  })

  document.getElementById('clearData')?.addEventListener('click', () => {
    if (!confirm(t('clearData') + '?')) return
    state.store = defaultStore()
    state.sessionId = null
    saveStore()
    alert(t('cleared'))
    navigate('home')
  })

  const form = document.getElementById('chatForm')
  const draft = document.getElementById('draft')
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = draft?.value.trim()
    if (!text) return
    const s = ensureSession()
    s.messages.push({ id: uid(), role: 'user', content: text })
    s.messages.push({ id: uid(), role: 'mira', content: reflect(text, state.locale) })
    s.mirror = null
    s.pathways = []
    if (s.title === 'Reflection' || s.title === '反思') {
      s.title = text.slice(0, 42) || s.title
    }
    saveStore()
    render()
  })
  draft?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      form?.requestSubmit()
    }
  })

  document.getElementById('btnMirror')?.addEventListener('click', () => {
    const s = ensureSession()
    const texts = s.messages.filter((m) => m.role === 'user').map((m) => m.content)
    s.mirror = mirror(texts, state.locale)
    saveStore()
    render()
  })

  document.getElementById('btnFutures')?.addEventListener('click', () => {
    const s = ensureSession()
    const texts = s.messages.filter((m) => m.role === 'user').map((m) => m.content)
    if (!s.mirror) s.mirror = mirror(texts, state.locale)
    s.pathways = pathways(s.mirror, state.locale)
    saveStore()
    navigate('futures', s.id)
  })
}

window.addEventListener('hashchange', () => {
  parseHash()
  render()
})

parseHash()
if (!location.hash) location.hash = '#home'
render()
