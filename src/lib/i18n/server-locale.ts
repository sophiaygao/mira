import { cookies, headers } from 'next/headers'
import { dictionaries, isLocale, type Locale, type TranslationKey } from './translations'

export async function getRequestLocale(): Promise<Locale> {
  const h = await headers()
  const fromHeader = h.get('x-mira-locale')
  if (isLocale(fromHeader)) return fromHeader

  const jar = await cookies()
  const fromCookie = jar.get('mira_locale')?.value
  if (isLocale(fromCookie)) return fromCookie

  return 'en'
}

export function localeFromBody(body: unknown): Locale | null {
  if (!body || typeof body !== 'object') return null
  const locale = (body as { locale?: unknown }).locale
  return isLocale(locale) ? locale : null
}

export function tServer(locale: Locale, key: TranslationKey) {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key
}

export function languageInstruction(locale: Locale) {
  if (locale === 'zh') {
    return `LANGUAGE
Respond entirely in Simplified Chinese (简体中文).
Keep the collaborative “我们” therapeutic voice.
Use Chinese labels for the eight value pillars when naming them:
健康、人际关系、工作 / 事业、个人成长、财务、生活方式、贡献、精神 / 意义.`
  }
  return `LANGUAGE
Respond entirely in English.
Keep the collaborative “we / us” therapeutic voice.`
}
