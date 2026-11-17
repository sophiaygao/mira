'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { useAvatar } from '@/lib/avatar/AvatarProvider'

const HINT_KEY = 'mira_pet_hint_seen'

export function CompanionPet() {
  const { t } = useLanguage()
  const { url, ready, mood, aside, requestNudge } = useAvatar()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    try {
      setShowHint(window.localStorage.getItem(HINT_KEY) !== '1')
    } catch {
      setShowHint(true)
    }
  }, [])

  if (!ready || !url) return null

  function onTap() {
    if (showHint) {
      setShowHint(false)
      try {
        window.localStorage.setItem(HINT_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    requestNudge()
  }

  return (
    <div
      className={`mira-pet mira-pet--${mood} ${showHint ? 'mira-pet--show-hint' : ''} pointer-events-none fixed bottom-3 right-3 z-30 sm:bottom-5 sm:right-5`}
    >
      {aside && (
        <div
          className="mira-pet__bubble font-editorial pointer-events-none"
          role="status"
          aria-live="polite"
        >
          {aside}
        </div>
      )}
      <button
        type="button"
        className="mira-pet__bob pointer-events-auto"
        title={t('avatarPetNudge')}
        aria-label={t('avatarPetNudge')}
        onClick={onTap}
      >
        <div className="mira-pet__body">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="mira-pet__face" />
        </div>
        <span className="mira-pet__shadow" aria-hidden />
      </button>
      <p className="mira-pet__hint pointer-events-none">{t('avatarPetHint')}</p>
    </div>
  )
}
