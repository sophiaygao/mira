import { randomUUID } from 'crypto'
import { getServiceSupabase, isSupabaseConfigured } from '../supabase/server'
import type {
  DashboardData,
  Message,
  MirrorInsight,
  Pathway,
  Session,
  SessionDetail,
  SessionStatus,
} from '../types'
import * as local from './local-store'

export { isSupabaseConfigured }

export async function ensureProfile(guestId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.ensureProfile(guestId)
  await sb.from('mira_guests').upsert({ guest_id: guestId }, { onConflict: 'guest_id' })
}

export async function createSession(guestId: string, title = 'Reflection') {
  const sb = getServiceSupabase()
  if (!sb) return local.createSession(guestId, title)
  await ensureProfile(guestId)
  const { data, error } = await sb
    .from('mira_sessions')
    .insert({ guest_id: guestId, title, status: 'reflecting' })
    .select('*')
    .single()
  if (error) throw error
  return data as Session
}

export async function listSessions(guestId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.listSessions(guestId)
  const { data, error } = await sb
    .from('mira_sessions')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Session[]
}

export async function getSession(sessionId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.getSession(sessionId)
  const { data, error } = await sb
    .from('mira_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  return (data as Session) || null
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  const sb = getServiceSupabase()
  if (!sb) return local.updateSessionStatus(sessionId, status)
  const { error } = await sb
    .from('mira_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.updateSessionTitle(sessionId, title)
  const { error } = await sb
    .from('mira_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

export async function addMessage(input: Omit<Message, 'id' | 'created_at'>) {
  const sb = getServiceSupabase()
  if (!sb) return local.addMessage(input)
  const { data, error } = await sb
    .from('mira_messages')
    .insert({
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      prompt_key: input.prompt_key ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  await sb
    .from('mira_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.session_id)
  return data as Message
}

export async function listMessages(sessionId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.listMessages(sessionId)
  const { data, error } = await sb
    .from('mira_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as Message[]
}

export async function saveMirror(mirror: Omit<MirrorInsight, 'id' | 'created_at'>) {
  const sb = getServiceSupabase()
  if (!sb) return local.saveMirror(mirror)
  await sb.from('mira_mirrors').delete().eq('session_id', mirror.session_id)
  const { data, error } = await sb
    .from('mira_mirrors')
    .insert({
      session_id: mirror.session_id,
      values: mirror.values,
      motivations: mirror.motivations,
      tensions: mirror.tensions,
      emotions: mirror.emotions,
      themes: mirror.themes,
      summary_lines: mirror.summary_lines,
      raw: mirror.raw ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as MirrorInsight
}

export async function getMirror(sessionId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.getMirror(sessionId)
  const { data, error } = await sb
    .from('mira_mirrors')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  return (data as MirrorInsight) || null
}

export async function savePathways(
  sessionId: string,
  pathways: Omit<Pathway, 'id' | 'created_at' | 'session_id'>[],
) {
  const sb = getServiceSupabase()
  if (!sb) return local.savePathways(sessionId, pathways)
  await sb.from('mira_pathways').delete().eq('session_id', sessionId)
  const rows = pathways.map((p, i) => ({
    session_id: sessionId,
    title: p.title,
    description: p.description,
    values: p.values,
    opportunities: p.opportunities,
    tradeoffs: p.tradeoffs,
    sort_order: p.sort_order ?? i,
  }))
  const { data, error } = await sb.from('mira_pathways').insert(rows).select('*')
  if (error) throw error
  return (data || []) as Pathway[]
}

export async function listPathways(sessionId: string) {
  const sb = getServiceSupabase()
  if (!sb) return local.listPathways(sessionId)
  const { data, error } = await sb
    .from('mira_pathways')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []) as Pathway[]
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const sb = getServiceSupabase()
  if (!sb) return local.getSessionDetail(sessionId)
  const session = await getSession(sessionId)
  if (!session) return null
  const [messages, mirror, pathways] = await Promise.all([
    listMessages(sessionId),
    getMirror(sessionId),
    listPathways(sessionId),
  ])
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

export async function getDashboard(guestId: string): Promise<DashboardData> {
  const sb = getServiceSupabase()
  if (!sb) return local.getDashboard(guestId)

  const sessions = await listSessions(guestId)
  if (!sessions.length) {
    return {
      sessions: [],
      values: [],
      emotions: [],
      themes: [],
      tensions: [],
      pathwayCount: 0,
      timeline: [],
    }
  }

  const ids = sessions.map((s) => s.id)
  const [{ data: mirrors }, { data: pathways }] = await Promise.all([
    sb.from('mira_mirrors').select('*').in('session_id', ids),
    sb.from('mira_pathways').select('id, session_id').in('session_id', ids),
  ])

  const mirrorRows = (mirrors || []) as MirrorInsight[]
  const timeline = sessions.map((s) => {
    const m = mirrorRows.find((x) => x.session_id === s.id)
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
    values: tally(mirrorRows.flatMap((m) => m.values || [])),
    emotions: tally(mirrorRows.flatMap((m) => m.emotions || [])),
    themes: tally(mirrorRows.flatMap((m) => m.themes || [])),
    tensions: tally(mirrorRows.flatMap((m) => m.tensions || [])),
    pathwayCount: (pathways || []).length,
    timeline,
  }
}

export function newId() {
  return randomUUID()
}

/** Clear data for a guest (local JSON and/or Supabase) so you can mimic a new user. */
export async function clearGuestData(guestId: string): Promise<{ mode: 'local' | 'supabase' }> {
  const sb = getServiceSupabase()
  if (!sb) {
    await local.clearAll()
    return { mode: 'local' }
  }

  const { data: sessions, error: listError } = await sb
    .from('mira_sessions')
    .select('id')
    .eq('guest_id', guestId)
  if (listError) throw listError

  const ids = (sessions || []).map((s) => s.id as string)
  if (ids.length) {
    await sb.from('mira_pathways').delete().in('session_id', ids)
    await sb.from('mira_mirrors').delete().in('session_id', ids)
    await sb.from('mira_messages').delete().in('session_id', ids)
    await sb.from('mira_sessions').delete().in('id', ids)
  }
  await sb.from('mira_guests').delete().eq('guest_id', guestId)
  // Also wipe local JSON so mixed-mode leftovers don’t linger.
  await local.clearAll()
  return { mode: 'supabase' }
}
