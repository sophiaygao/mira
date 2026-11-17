import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type {
  DashboardData,
  Message,
  MirrorInsight,
  Pathway,
  Session,
  SessionDetail,
  SessionStatus,
} from '../types'

type Store = {
  profiles: { guest_id: string; created_at: string }[]
  sessions: Session[]
  messages: Message[]
  mirrors: MirrorInsight[]
  pathways: Pathway[]
}

const DATA_DIR = path.join(process.cwd(), '.data')
const STORE_PATH = path.join(DATA_DIR, 'store.json')

const empty = (): Store => ({
  profiles: [],
  sessions: [],
  messages: [],
  mirrors: [],
  pathways: [],
})

/** Serialize all store mutations — concurrent reads/writes were dropping welcome messages. */
let chain: Promise<unknown> = Promise.resolve()

function withStore<T>(fn: (store: Store) => Promise<T> | T): Promise<T> {
  const run = chain.then(async () => {
    const store = await read()
    const result = await fn(store)
    await write(store)
    return result
  })
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    return JSON.parse(raw) as Store
  } catch {
    return empty()
  }
}

async function write(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function now() {
  return new Date().toISOString()
}

async function readConsistent(): Promise<Store> {
  await chain
  return read()
}

export async function ensureProfile(guestId: string) {
  await withStore((store) => {
    if (!store.profiles.some((p) => p.guest_id === guestId)) {
      store.profiles.push({ guest_id: guestId, created_at: now() })
    }
  })
}

export async function createSession(guestId: string, title = 'Reflection'): Promise<Session> {
  return withStore((store) => {
    if (!store.profiles.some((p) => p.guest_id === guestId)) {
      store.profiles.push({ guest_id: guestId, created_at: now() })
    }
    const session: Session = {
      id: randomUUID(),
      guest_id: guestId,
      title,
      status: 'reflecting',
      created_at: now(),
      updated_at: now(),
    }
    store.sessions.unshift(session)
    return session
  })
}

export async function listSessions(guestId: string): Promise<Session[]> {
  const store = await readConsistent()
  return store.sessions
    .filter((s) => s.guest_id === guestId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const store = await readConsistent()
  return store.sessions.find((s) => s.id === sessionId) ?? null
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  await withStore((store) => {
    const s = store.sessions.find((x) => x.id === sessionId)
    if (!s) return
    s.status = status
    s.updated_at = now()
  })
}

export async function updateSessionTitle(sessionId: string, title: string) {
  await withStore((store) => {
    const s = store.sessions.find((x) => x.id === sessionId)
    if (!s) return
    s.title = title
    s.updated_at = now()
  })
}

export async function addMessage(
  input: Omit<Message, 'id' | 'created_at'>,
): Promise<Message> {
  return withStore((store) => {
    const message: Message = {
      ...input,
      id: randomUUID(),
      created_at: now(),
    }
    store.messages.push(message)
    const s = store.sessions.find((x) => x.id === input.session_id)
    if (s) s.updated_at = now()
    return message
  })
}

export async function listMessages(sessionId: string): Promise<Message[]> {
  const store = await readConsistent()
  return store.messages
    .filter((m) => m.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function saveMirror(
  mirror: Omit<MirrorInsight, 'id' | 'created_at'>,
): Promise<MirrorInsight> {
  return withStore((store) => {
    store.mirrors = store.mirrors.filter((m) => m.session_id !== mirror.session_id)
    const row: MirrorInsight = { ...mirror, id: randomUUID(), created_at: now() }
    store.mirrors.push(row)
    return row
  })
}

export async function getMirror(sessionId: string): Promise<MirrorInsight | null> {
  const store = await readConsistent()
  return store.mirrors.find((m) => m.session_id === sessionId) ?? null
}

export async function savePathways(
  sessionId: string,
  pathways: Omit<Pathway, 'id' | 'created_at' | 'session_id'>[],
): Promise<Pathway[]> {
  return withStore((store) => {
    store.pathways = store.pathways.filter((p) => p.session_id !== sessionId)
    const rows = pathways.map((p, i) => ({
      ...p,
      id: randomUUID(),
      session_id: sessionId,
      sort_order: p.sort_order ?? i,
      created_at: now(),
    }))
    store.pathways.push(...rows)
    return rows
  })
}

export async function listPathways(sessionId: string): Promise<Pathway[]> {
  const store = await readConsistent()
  return store.pathways
    .filter((p) => p.session_id === sessionId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function getSessionDetail(
  sessionId: string,
): Promise<SessionDetail | null> {
  const store = await readConsistent()
  const session = store.sessions.find((s) => s.id === sessionId)
  if (!session) return null
  const messages = store.messages
    .filter((m) => m.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const mirror = store.mirrors.find((m) => m.session_id === sessionId) ?? null
  const pathways = store.pathways
    .filter((p) => p.session_id === sessionId)
    .sort((a, b) => a.sort_order - b.sort_order)
  return { ...session, messages, mirror, pathways }
}

function tally(items: string[]) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = item.trim()
    if (!key) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Wipe the entire local JSON store (dev “trash can”). */
export async function clearAll(): Promise<void> {
  await withStore((store) => {
    store.profiles = []
    store.sessions = []
    store.messages = []
    store.mirrors = []
    store.pathways = []
  })
}

/** Remove one guest’s rows from the local JSON store. */
export async function clearGuest(guestId: string): Promise<void> {
  await withStore((store) => {
    const sessionIds = new Set(
      store.sessions.filter((s) => s.guest_id === guestId).map((s) => s.id),
    )
    store.profiles = store.profiles.filter((p) => p.guest_id !== guestId)
    store.sessions = store.sessions.filter((s) => s.guest_id !== guestId)
    store.messages = store.messages.filter((m) => !sessionIds.has(m.session_id))
    store.mirrors = store.mirrors.filter((m) => !sessionIds.has(m.session_id))
    store.pathways = store.pathways.filter((p) => !sessionIds.has(p.session_id))
  })
}

export async function getDashboard(guestId: string): Promise<DashboardData> {
  const store = await readConsistent()
  const sessions = store.sessions
    .filter((s) => s.guest_id === guestId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const sessionIds = new Set(sessions.map((s) => s.id))
  const mirrors = store.mirrors.filter((m) => sessionIds.has(m.session_id))
  const pathways = store.pathways.filter((p) => sessionIds.has(p.session_id))

  const timeline = sessions.map((s) => {
    const m = mirrors.find((x) => x.session_id === s.id)
    return {
      sessionId: s.id,
      title: s.title,
      createdAt: s.created_at,
      themes: m?.themes ?? [],
      values: m?.values ?? [],
    }
  })

  return {
    sessions,
    values: tally(mirrors.flatMap((m) => m.values)),
    emotions: tally(mirrors.flatMap((m) => m.emotions)),
    themes: tally(mirrors.flatMap((m) => m.themes)),
    tensions: tally(mirrors.flatMap((m) => m.tensions)),
    pathwayCount: pathways.length,
    timeline,
  }
}
