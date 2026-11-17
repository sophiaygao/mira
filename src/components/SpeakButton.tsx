'use client'

import { useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'

/** Speaks Mira's text reply with Hume empathic TTS when configured. */
export function SpeakButton({ text }: { text: string }) {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function speak() {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/hume/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUnavailable(true)
        return
      }
      const src = `data:audio/mp3;base64,${data.audio}`
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(src)
      audioRef.current = audio
      await audio.play()
    } catch {
      setUnavailable(true)
    } finally {
      setBusy(false)
    }
  }

  if (unavailable) return null

  return (
    <button
      type="button"
      onClick={() => void speak()}
      disabled={busy}
      className="mt-1 rounded-lg px-2 py-1 text-xs text-sage-deep/80 transition hover:bg-white/50 disabled:opacity-50"
      aria-label="Speak with Hume voice"
    >
      {busy ? t('speaking') : t('hearMira')}
    </button>
  )
}
