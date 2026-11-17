'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useAvatar } from '@/lib/avatar/AvatarProvider'

export function JsonTrashCan({ className = '' }: { className?: string }) {
  const { t } = useLanguage()
  const { setUrl } = useAvatar()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function empty() {
    if (busy) return
    const ok = window.confirm(t('trashConfirm'))
    if (!ok) return

    setBusy(true)
    try {
      const res = await fetch('/api/dev/trash', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not clear')
      setUrl(null)
      router.push('/')
      router.refresh()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('trashFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void empty()}
      disabled={busy}
      title={t('trashTitle')}
      aria-label={t('trashTitle')}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-sage/20 bg-white/45 text-ink-soft transition hover:border-clay/50 hover:bg-blush/60 hover:text-forest disabled:opacity-40 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  )
}
