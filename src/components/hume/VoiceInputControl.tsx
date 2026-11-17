'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  VoiceProvider,
  VoiceReadyState,
  useVoice,
} from '@humeai/voice-react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

type AuthPayload = {
  accessToken: string
  configId: string
}

type Props = {
  sessionId: string
  onSynced?: () => void
  onActiveChange?: (active: boolean) => void
}

function MicButton({
  sessionId,
  onSynced,
  onActiveChange,
  auth,
  authError,
  authLoading,
  onRequestAuth,
}: Props & {
  auth: AuthPayload | null
  authError: string | null
  authLoading: boolean
  onRequestAuth: () => void
}) {
  const { t } = useLanguage()
  const {
    connect,
    disconnect,
    readyState,
    messages,
    status,
    error,
  } = useVoice()
  const syncedIds = useRef(new Set<string>())
  const [connecting, setConnecting] = useState(false)
  const open = readyState === VoiceReadyState.OPEN

  useEffect(() => {
    onActiveChange?.(open)
  }, [open, onActiveChange])

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
      }
      if (msg.type === 'assistant_message') {
        const content = msg.message.content || ''
        const key = `mira:${msg.receivedAt}:${content.slice(0, 40)}`
        void persist('mira', content, key)
      }
    }
  }, [messages, persist])

  async function toggle() {
    if (open) {
      disconnect()
      return
    }

    if (!auth) {
      onRequestAuth()
      return
    }

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

  // Auto-connect once auth arrives after a mic tap
  const pendingConnect = useRef(false)
  useEffect(() => {
    if (!pendingConnect.current || !auth || open || connecting) return
    pendingConnect.current = false
    void (async () => {
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
    })()
  }, [auth, open, connecting, connect])

  function onClick() {
    if (!auth && !authLoading) {
      pendingConnect.current = true
      onRequestAuth()
      return
    }
    void toggle()
  }

  const busy = connecting || authLoading
  const label = open
    ? t('endVoice')
    : busy
      ? t('connecting')
      : t('startVoiceMic')

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={busy && !open}
        aria-label={label}
        aria-pressed={open}
        title={authError || label}
        className={`grid h-10 w-10 place-items-center rounded-xl transition disabled:opacity-40 ${
          open
            ? 'animate-breathe bg-forest text-linen'
            : 'border border-sage/30 bg-linen text-forest hover:bg-mist/80'
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <rect x="7" y="7" width="10" height="10" rx="1.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
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
        )}
      </button>
      {(authError || error || (open && status.value !== 'error')) && (
        <span className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-lg bg-forest/90 px-2.5 py-1 text-center text-[0.65rem] leading-snug text-[var(--btn-label,#f5f2ea)] shadow-sm">
          {authError
            ? t('voiceNeedsKeys')
            : error && 'message' in error
              ? error.message
              : open
                ? t('listening')
                : null}
        </span>
      )}
    </div>
  )
}

function VoiceGate(props: Props) {
  const [auth, setAuth] = useState<AuthPayload | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const requestAuth = useCallback(() => {
    if (auth || authLoading) return
    setAuthLoading(true)
    setAuthError(null)
    void (async () => {
      try {
        const res = await fetch('/api/hume/token')
        const data = await res.json()
        if (!res.ok || !data.configured) {
          throw new Error(data.error || 'Hume is not configured')
        }
        setAuth({ accessToken: data.accessToken, configId: data.configId })
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : 'Could not start voice')
      } finally {
        setAuthLoading(false)
      }
    })()
  }, [auth, authLoading])

  return (
    <VoiceProvider
      onError={(err) => {
        console.error('Hume voice error', err)
      }}
    >
      <MicButton
        {...props}
        auth={auth}
        authError={authError}
        authLoading={authLoading}
        onRequestAuth={requestAuth}
      />
    </VoiceProvider>
  )
}

export function VoiceInputControl(props: Props) {
  return <VoiceGate {...props} />
}
