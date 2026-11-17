'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import type { Message } from '@/lib/types'
import { SpeakButton } from './SpeakButton'
import { useLanguage, withLocaleHeaders } from '@/lib/i18n/LanguageProvider'
import { useAvatar } from '@/lib/avatar/AvatarProvider'

const VoiceInputControl = dynamic(
  () => import('./hume/VoiceInputControl').then((m) => m.VoiceInputControl),
  { ssr: false, loading: () => <MicPlaceholder /> },
)

function MicPlaceholder() {
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sage/30 bg-linen text-forest/45"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

type Props = {
  sessionId: string
  initialMessages: Message[]
  onUpdated?: () => void
}

export function ReflectionChat({ sessionId, initialMessages, onUpdated }: Props) {
  const { t, locale } = useLanguage()
  const { url: petUrl, setMood, whisperThinking, whisperSettled } = useAvatar()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevMiraCount = useRef(initialMessages.filter((m) => m.role === 'mira').length)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Draft / thinking → companion mood
  useEffect(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }

    if (thinking || voiceActive) {
      setMood('thinking')
      return
    }

    if (draft.trim()) {
      setMood('attending')
      return
    }

    idleTimer.current = setTimeout(() => setMood('idle'), 2200)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [draft, thinking, voiceActive, setMood])

  // Whisper while Mira is generating
  useEffect(() => {
    if (!thinking || !petUrl) return
    whisperThinking()
  }, [thinking, petUrl, whisperThinking])

  // Settle + whisper when a new Mira reply lands
  useEffect(() => {
    const miraCount = messages.filter((m) => m.role === 'mira').length
    if (petUrl && miraCount > prevMiraCount.current) {
      setMood('settled')
      whisperSettled()
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setMood('idle'), 4500)
    }
    prevMiraCount.current = miraCount
  }, [messages, petUrl, setMood, whisperSettled])

  // Leave the pet idle when leaving the chat
  useEffect(() => {
    return () => {
      setMood('idle')
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [setMood])

  function resize() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  async function send() {
    const text = draft.trim()
    if (!text || thinking || voiceActive) return
    setError(null)
    setDraft('')
    setThinking(true)
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.style.height = 'auto'
    })

    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/messages`,
        withLocaleHeaders(locale, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text, locale }),
        }),
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send')
      setMessages((prev) => [...prev, data.user, data.mira])
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went quiet. Try again.')
      setDraft(text)
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex min-h-[28rem] flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4" role="log" aria-live="polite">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`animate-rise flex max-w-[92%] flex-col gap-1 ${
              m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <span className="flex items-center gap-1.5 px-1 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft/70">
              {m.role === 'mira' && petUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={petUrl} alt="" className="mira-chat-pet" />
              ) : null}
              {m.role === 'user' ? t('you') : t('mira')}
            </span>
            <div
              className={`prose-mira rounded-2xl px-4 py-3 text-[1.02rem] ${
                m.role === 'user'
                  ? 'rounded-br-md border border-sage/20 bg-[var(--user-bubble)]'
                  : 'font-editorial rounded-bl-md border border-white/55 bg-[var(--mira-bubble)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'mira' && <SpeakButton text={m.content} />}
          </article>
        ))}
        {thinking && (
          <div className="animate-rise flex max-w-[92%] flex-col gap-1 self-start">
            <span className="flex items-center gap-1.5 px-1 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft/70">
              {petUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={petUrl} alt="" className="mira-chat-pet" />
              ) : null}
              {t('mira')}
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/55 bg-[var(--mira-bubble)] px-4 py-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-center text-sm text-red-700/80">{error}</p>}

      <form onSubmit={onSubmit} className="sticky bottom-0 pt-2">
        <div className="glass-panel flex items-end gap-2 rounded-2xl px-3 py-2.5 sm:px-4">
          <VoiceInputControl
            sessionId={sessionId}
            onSynced={onUpdated}
            onActiveChange={setVoiceActive}
          />
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            placeholder={voiceActive ? t('listening') : t('writeFreely')}
            aria-label={voiceActive ? t('listening') : t('writeFreely')}
            disabled={voiceActive}
            className="max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent py-2 text-[1.02rem] outline-none placeholder:text-ink-soft/65 disabled:cursor-default disabled:opacity-70"
            onChange={(e) => {
              setDraft(e.target.value)
              resize()
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="submit"
            disabled={!draft.trim() || thinking || voiceActive}
            aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage-deep text-[#f4faf7] transition hover:bg-sage disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[0.7rem] text-ink-soft/70">
          {voiceActive ? t('voiceUsesMic') : t('keepGoing')}
        </p>
      </form>
    </div>
  )
}
