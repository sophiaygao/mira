'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  dictionaries,
  isLocale,
  type Locale,
  type TranslationKey,
} from './translations'

const STORAGE_KEY = 'mira_locale'
const COOKIE_KEY = 'mira_locale'

function persistLocale(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`
}

/** Reflect entry with explicit locale so the server opening prompt matches the toggle. */
export function reflectHref(locale: Locale) {
  return `/reflect?locale=${locale}`
}

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) {
      setLocaleState(stored)
      persistLocale(stored)
    } else {
      persistLocale('en')
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    persistLocale(locale)
  }, [locale, ready])

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next)
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** Safe fetch helper: attach locale for API routes. */
export function withLocaleHeaders(locale: Locale, init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  headers.set('x-mira-locale', locale)
  return { ...init, headers }
}
