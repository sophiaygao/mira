import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DM_Sans, Newsreader, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { Atmosphere } from '@/components/Atmosphere'
import { Nav } from '@/components/Nav'
import { CompanionPet } from '@/components/CompanionPet'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import { AvatarProvider } from '@/lib/avatar/AvatarProvider'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const notoSansSc = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const notoSerifSc = Noto_Serif_SC({
  variable: '--font-noto-serif-sc',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Mira — Reflective futures',
  description:
    'A calm AI companion for reflection, value discovery, and imagining multiple possible futures.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${dmSans.variable} ${newsreader.variable} ${notoSansSc.variable} ${notoSerifSc.variable} h-full antialiased`}
    >
      <body
        className="relative flex min-h-full flex-col font-sans text-ink"
        suppressHydrationWarning
        style={{
          fontFamily: 'var(--font-dm-sans), var(--font-noto-sc), system-ui, sans-serif',
        }}
      >
        <LanguageProvider>
          <AvatarProvider>
            <Atmosphere />
            <Suspense fallback={<div className="h-[68px]" />}>
              <Nav />
            </Suspense>
            <main className="relative z-10 flex flex-1 flex-col pb-28">{children}</main>
            <CompanionPet />
          </AvatarProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
