import { NextResponse } from 'next/server'
import { hasOpenAI } from '@/lib/openai'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { avatarStorageMode } from '@/lib/avatar-store'

/** Safe config probe for local vs Vercel debugging (no secrets). */
export async function GET() {
  const openai = hasOpenAI()
  const supabase = isSupabaseConfigured()
  const onVercel = Boolean(process.env.VERCEL)
  const notes: string[] = []
  if (!openai) {
    notes.push('OPENAI_API_KEY missing — chat uses local fallbacks.')
  }
  if (onVercel && !supabase) {
    notes.push(
      'On Vercel without Supabase, avatar upload cannot persist. Add Supabase env vars + mira-avatars bucket.',
    )
  }
  if (!notes.length) notes.push('OpenAI + storage look configured.')

  return NextResponse.json({
    openai,
    openaiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2',
    supabase,
    avatarStorage: avatarStorageMode(),
    vercel: onVercel,
    hume: Boolean(process.env.HUME_API_KEY?.trim() && process.env.HUME_SECRET_KEY?.trim()),
    note: notes.join(' '),
  })
}
