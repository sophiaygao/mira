'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  VoiceProvider,
  VoiceReadyState,
  useMicFft,
  useVoice,
  type UserTranscriptMessage,
  type AssistantTranscriptMessage,
} from '@humeai/voice-react'
import { topEmotions, type EmotionTop } from '@/lib/hume-shared'
import { ExpressionBars } from './ExpressionBars'

type AuthPayload = {
  accessToken: string
  configId: string
}

type Props = {
  sessionId: string
  onSynced?: () => void
}

function scoresFromMessage(
  msg: UserTranscriptMessage | AssistantTranscriptMessage,
): EmotionTop[] {
  const scores = msg.models?.prosody?.scores as Record<string, number> | undefined
  return topEmotions(scores, 3)
}

function VoiceSession({ sessionId, onSynced, auth }: Props & { auth: AuthPayload }) {
  const {
    connect,
    disconnect,
    readyState,
    messages,
    isMuted,
    mute,
    unmute,
    status,
    error,
  } = useVoice()
  const micFft = useMicFft()

  const syncedIds = useRef(new Set<string>())
  const [liveEmotions, setLiveEmotions] = useState<EmotionTop[]>([])
  const [connecting, setConnecting] = useState(false)

  const persist = useCallback(
    async (role: 'user' | 'mira', content: string, dedupeKey: string) => {
      if (!content.trim() || syncedIds.current.has(dedupeKey)) return
      syncedIds.current.add(dedupeKey)
      try {
        await fetch(`/api/sessions/${sessionId}/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, content }),
        })
        onSynced?.()
      } catch {
        syncedIds.current.delete(dedupeKey)
      }
    },
    [sessionId, onSynced],
  )

  useEffect(() => {
    for (const msg of messages) {
      if (msg.type === 'user_message') {
        const content = msg.message.content || ''
        const key = `user:${msg.receivedAt}:${content.slice(0, 40)}`
        void persist('user', content, key)
        setLiveEmotions(scoresFromMessage(msg))
      }
      if (msg.type === 'assistant_message') {
        const content = msg.message.content || ''
        const key = `mira:${msg.receivedAt}:${content.slice(0, 40)}`
        void persist('mira', content, key)
        const emo = scoresFromMessage(msg)
        if (emo.length) setLiveEmotions(emo)
      }
    }
  }, [messages, persist])

  const transcript = useMemo(() => {
    return messages.filter(
      (m): m is UserTranscriptMessage | AssistantTranscriptMessage =>
        m.type === 'user_message' || m.type === 'assistant_message',
    )
  }, [messages])

  const open = readyState === VoiceReadyState.OPEN
  const micLevel = useMemo(() => {
    if (!micFft?.length) return 0
    const avg = micFft.reduce((a, b) => a + b, 0) / micFft.length
    return Math.min(1, avg * 2.2)
  }, [micFft])

  async function start() {
    setConnecting(true)
    try {
      await connect({
        auth: { type: 'accessToken', value: auth.accessToken },
        configId: auth.configId,
      })
    } catch {
      /* surfaced via useVoice error */
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">Empathic voice</p>
          <h2 className="font-display mt-2 text-2xl text-sage-deep">Speak with Mira</h2>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Hume listens to tone as well as words — Mira responds with voice, expression, and
            gentle reflection.
          </p>

          <div
            className="relative mt-8 grid h-28 w-28 place-items-center rounded-full border border-sage/25 bg-white/40"
            aria-hidden
          >
            <div
              className="absolute inset-0 rounded-full bg-sage/20 transition-transform duration-150"
              style={{ transform: `scale(${1 + micLevel * 0.35})` }}
            />
            <div
              className={`relative h-16 w-16 rounded-full ${
                open ? 'animate-breathe bg-sage-deep/80' : 'bg-sage/35'
              }`}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {!open ? (
              <button
                type="button"
                onClick={() => void start()}
                disabled={connecting}
                className="rounded-xl bg-sage-deep px-5 py-2.5 text-sm text-[#f4faf7] transition hover:bg-sage disabled:opacity-50"
              >
                {connecting ? 'Connecting…' : 'Start voice session'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => (isMuted ? unmute() : mute())}
                  className="rounded-xl border border-sage/25 bg-white/45 px-4 py-2.5 text-sm text-sage-deep transition hover:bg-white/70"
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="rounded-xl bg-sage-deep px-4 py-2.5 text-sm text-[#f4faf7] transition hover:bg-sage"
                >
                  End voice
                </button>
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-ink-soft">
            {open
              ? 'Listening — speak when you’re ready.'
              : status.value === 'error'
                ? 'Connection paused.'
                : 'Uses your microphone. Transcripts are saved to this reflection.'}
          </p>
          {error && (
            <p className="mt-2 max-w-md text-sm text-red-700/80">
              {'message' in error ? error.message : 'Voice connection error'}
            </p>
          )}
        </div>

        {liveEmotions.length > 0 && (
          <div className="mt-8 border-t border-sage/15 pt-5">
            <ExpressionBars
              emotions={liveEmotions}
              caption={open ? 'Live vocal expression' : 'Last vocal expression'}
            />
          </div>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="glass-panel space-y-3 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.08em] text-ink-soft">Voice transcript</p>
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {transcript.map((msg, i) => {
              const isUser = msg.type === 'user_message'
              const emotions = scoresFromMessage(msg)
              return (
                <article
                  key={`${msg.type}-${i}-${msg.receivedAt}`}
                  className={`flex max-w-[92%] flex-col gap-1 ${
                    isUser ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <span className="px-1 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft/70">
                    {isUser ? 'You' : 'Mira'}
                  </span>
                  <div
                    className={`prose-mira rounded-2xl px-4 py-3 text-sm ${
                      isUser
                        ? 'rounded-br-md border border-sage/20 bg-[var(--user-bubble)]'
                        : 'font-editorial rounded-bl-md border border-white/55 bg-[var(--mira-bubble)]'
                    }`}
                  >
                    {msg.message.content}
                  </div>
                  {emotions.length > 0 && (
                    <div className="w-full max-w-xs px-1 pt-1">
                      <ExpressionBars emotions={emotions} caption="Expression" />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function VoiceGate({ sessionId, onSynced }: Props) {
  const [auth, setAuth] = useState<AuthPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/hume/token')
        const data = await res.json()
        if (!res.ok || !data.configured) {
          throw new Error(data.error || 'Hume is not configured')
        }
        if (!cancelled) {
          setAuth({ accessToken: data.accessToken, configId: data.configId })
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start empathic voice')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-sm text-ink-soft">
        Preparing empathic voice…
      </div>
    )
  }

  if (error || !auth) {
    return (
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl text-sage-deep">Voice needs Hume keys</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {error || 'Add your Hume credentials to enable voice, expression, and empathy.'}
        </p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink">
          <li>
            Create keys at{' '}
            <a
              className="text-sage-deep underline-offset-2 hover:underline"
              href="https://platform.hume.ai"
              target="_blank"
              rel="noreferrer"
            >
              platform.hume.ai
            </a>
          </li>
          <li>
            Add <code className="rounded bg-white/50 px-1">HUME_API_KEY</code> and{' '}
            <code className="rounded bg-white/50 px-1">HUME_SECRET_KEY</code> to{' '}
            <code className="rounded bg-white/50 px-1">.env.local</code>
          </li>
          <li>Restart the dev server, then return here</li>
        </ol>
      </div>
    )
  }

  return (
    <VoiceProvider
      onError={(err) => {
        console.error('Hume voice error', err)
      }}
    >
      <VoiceSession sessionId={sessionId} onSynced={onSynced} auth={auth} />
    </VoiceProvider>
  )
}

export function EmpathicVoicePanel(props: Props) {
  return <VoiceGate {...props} />
}
