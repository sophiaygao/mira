'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import {
  companionNudges,
  companionSettledAsides,
  companionThinkingAsides,
  pickCompanionLine,
} from './companionCopy'

export type CompanionMood = 'idle' | 'attending' | 'thinking' | 'settled'

type AvatarContextValue = {
  url: string | null
  ready: boolean
  setUrl: (url: string | null) => void
  refresh: () => Promise<void>
  mood: CompanionMood
  setMood: (mood: CompanionMood) => void
  aside: string | null
  whisper: (text: string, ms?: number) => void
  clearAside: () => void
  whisperThinking: () => void
  whisperSettled: () => void
  /** Show a thought-provoking line in the pet bubble only (does not fill the chat draft). */
  requestNudge: () => void
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

const ASIDE_MS = 4200

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const [url, setUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [mood, setMood] = useState<CompanionMood>('idle')
  const [aside, setAside] = useState<string | null>(null)

  const asideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastThinking = useRef<string | null>(null)
  const lastSettled = useRef<string | null>(null)
  const lastNudge = useRef<string | null>(null)
  const lastWhisperAt = useRef(0)

  const clearAside = useCallback(() => {
    if (asideTimer.current) clearTimeout(asideTimer.current)
    asideTimer.current = null
    setAside(null)
  }, [])

  const whisper = useCallback(
    (text: string, ms = ASIDE_MS) => {
      if (!text) return
      if (asideTimer.current) clearTimeout(asideTimer.current)
      setAside(text)
      asideTimer.current = setTimeout(() => {
        setAside(null)
        asideTimer.current = null
      }, ms)
    },
    [],
  )

  const whisperThinking = useCallback(() => {
    const now = Date.now()
    if (now - lastWhisperAt.current < 2800) return
    lastWhisperAt.current = now
    const line = pickCompanionLine(companionThinkingAsides[locale], lastThinking.current)
    lastThinking.current = line
    whisper(line)
  }, [locale, whisper])

  const whisperSettled = useCallback(() => {
    const line = pickCompanionLine(companionSettledAsides[locale], lastSettled.current)
    lastSettled.current = line
    lastWhisperAt.current = Date.now()
    whisper(line)
  }, [locale, whisper])

  const requestNudge = useCallback(() => {
    const line = pickCompanionLine(companionNudges[locale], lastNudge.current)
    lastNudge.current = line
    whisper(line, 5600)
  }, [locale, whisper])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/avatar', { method: 'HEAD' })
      if (res.ok) setUrl(`/api/avatar?t=${Date.now()}`)
      else setUrl(null)
    } catch {
      setUrl(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    return () => {
      if (asideTimer.current) clearTimeout(asideTimer.current)
    }
  }, [])

  const value = useMemo(
    () => ({
      url,
      ready,
      setUrl,
      refresh,
      mood,
      setMood,
      aside,
      whisper,
      clearAside,
      whisperThinking,
      whisperSettled,
      requestNudge,
    }),
    [
      url,
      ready,
      refresh,
      mood,
      aside,
      whisper,
      clearAside,
      whisperThinking,
      whisperSettled,
      requestNudge,
    ],
  )

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
}

export function useAvatar() {
  const ctx = useContext(AvatarContext)
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider')
  return ctx
}
