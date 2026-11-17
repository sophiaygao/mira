'use client'

import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { LOCALES, type Locale } from '@/lib/i18n/translations'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      className={`inline-flex items-center rounded-full border border-sage/20 bg-white/45 p-0.5 backdrop-blur-sm ${className}`}
      role="group"
      aria-label={t('langToggle')}
    >
      {LOCALES.map((l) => {
        const active = locale === l.id
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLocale(l.id as Locale)}
            className={`rounded-full px-2.5 py-1 text-xs transition ${
              active
                ? 'bg-sage-deep text-[#f4faf7]'
                : 'text-ink-soft hover:text-ink'
            }`}
            aria-pressed={active}
          >
            {l.short}
          </button>
        )
      })}
    </div>
  )
}
