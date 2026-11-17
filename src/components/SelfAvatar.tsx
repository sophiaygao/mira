'use client'

import { useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useAvatar } from '@/lib/avatar/AvatarProvider'

export function SelfAvatar({ className = '' }: { className?: string }) {
  const { t } = useLanguage()
  const { url, setUrl } = useAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file || busy) return
    setError(null)
    setBusy(true)
    try {
      const body = new FormData()
      body.append('image', file)
      const res = await fetch('/api/avatar', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('avatarFailed'))
      setUrl(data.url || `/api/avatar?t=${Date.now()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('avatarFailed'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    if (busy) return
    const ok = window.confirm(t('avatarRemoveConfirm'))
    if (!ok) return
    setBusy(true)
    try {
      await fetch('/api/avatar', { method: 'DELETE' })
      setUrl(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onContextMenu={(e) => {
          if (!url) return
          e.preventDefault()
          void remove()
        }}
        disabled={busy}
        title={url ? t('avatarReplace') : t('avatarUpload')}
        aria-label={url ? t('avatarReplace') : t('avatarUpload')}
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-sage/25 bg-linen text-forest shadow-sm transition hover:border-sage/45 hover:bg-mist/70 disabled:opacity-60"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <circle cx="12" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M5.5 19.2c1.4-2.6 3.7-4 6.5-4s5.1 1.4 6.5 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-linen/70">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sage" />
          </span>
        )}
      </button>
      {error && (
        <span className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-44 rounded-lg bg-forest/90 px-2 py-1 text-[0.65rem] leading-snug text-linen shadow-sm">
          {error}
        </span>
      )}
    </div>
  )
}
