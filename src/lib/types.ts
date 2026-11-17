export type SessionStatus = 'reflecting' | 'mirrored' | 'complete'

export type MessageRole = 'mira' | 'user' | 'system'

export type Message = {
  id: string
  session_id: string
  role: MessageRole
  content: string
  prompt_key?: string | null
  created_at: string
}

export type Session = {
  id: string
  guest_id: string
  title: string
  status: SessionStatus
  created_at: string
  updated_at: string
}

export type MirrorInsight = {
  id: string
  session_id: string
  values: string[]
  motivations: string[]
  tensions: string[]
  emotions: string[]
  themes: string[]
  summary_lines: string[]
  raw?: unknown
  created_at: string
}

export type Pathway = {
  id: string
  session_id: string
  title: string
  description: string
  values: string[]
  opportunities: string[]
  tradeoffs: string[]
  sort_order: number
  created_at: string
}

export type SessionDetail = Session & {
  messages: Message[]
  mirror: MirrorInsight | null
  pathways: Pathway[]
}

export type DashboardData = {
  sessions: Session[]
  values: { name: string; count: number }[]
  emotions: { name: string; count: number }[]
  themes: { name: string; count: number }[]
  tensions: { name: string; count: number }[]
  pathwayCount: number
  timeline: {
    sessionId: string
    title: string
    createdAt: string
    themes: string[]
    values: string[]
  }[]
}

export const SEED_PROMPTS = [
  {
    key: 'occupying',
    text: 'What has been occupying your thoughts recently?',
  },
  {
    key: 'future',
    text: 'What kind of future are you hoping for?',
  },
  {
    key: 'values',
    text: 'What values feel most important in your life right now?',
  },
  {
    key: 'uncertainty',
    text: 'What uncertainty are you currently navigating?',
  },
] as const

export type SeedPromptKey = (typeof SEED_PROMPTS)[number]['key']
