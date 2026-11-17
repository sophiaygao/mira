'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mark } from './Mark'
import { LanguageToggle } from './LanguageToggle'
import { JsonTrashCan } from './JsonTrashCan'
import { SelfAvatar } from './SelfAvatar'
import { reflectHref, useLanguage } from '@/lib/i18n/LanguageProvider'

export function Nav() {
  const pathname = usePathname()
  const { t, locale } = useLanguage()
  const isHome = pathname === '/'

  const links = [
    { href: reflectHref(locale), label: t('navReflect'), match: '/reflect' },
    { href: '/dashboard', label: t('navDashboard'), match: '/dashboard' },
    { href: '/history', label: t('navHistory'), match: '/history' },
    { href: '/plans', label: t('navPlans'), match: '/plans' },
  ]

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 text-sage-deep">
        <Mark className="h-7 w-7" />
        <span className="font-display text-xl font-medium tracking-tight">Mira</span>
      </Link>

      {!isHome && (
        <nav className="ml-2 hidden items-center gap-1 sm:flex sm:gap-2">
          {links.map((l) => {
            const active = pathname === l.match || pathname.startsWith(`${l.match}/`)
            return (
              <Link
                key={l.match}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? 'bg-white/50 text-sage-deep'
                    : 'text-ink-soft hover:bg-white/35 hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        {!isHome && (
          <nav className="flex items-center gap-1 sm:hidden">
            {links.map((l) => {
              const active = pathname === l.match || pathname.startsWith(`${l.match}/`)
              return (
                <Link
                  key={l.match}
                  href={l.href}
                  className={`rounded-lg px-2 py-1 text-xs transition ${
                    active ? 'bg-white/50 text-sage-deep' : 'text-ink-soft'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>
        )}
        <SelfAvatar />
        <JsonTrashCan />
        <LanguageToggle />
      </div>
    </header>
  )
}
