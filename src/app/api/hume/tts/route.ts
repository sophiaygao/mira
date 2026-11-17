import { NextResponse } from 'next/server'
import { HumeClient } from 'hume'
import { isHumeConfigured } from '@/lib/hume'
import { MIRA_HUME_VOICE } from '@/lib/hume-shared'

export async function POST(req: Request) {
  try {
    if (!isHumeConfigured()) {
      return NextResponse.json({ error: 'Hume is not configured' }, { status: 503 })
    }

    const body = (await req.json()) as { text?: string }
    const text = body.text?.trim()
    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const client = new HumeClient({ apiKey: process.env.HUME_API_KEY! })
    const speech = await client.tts.synthesizeJson({
      utterances: [
        {
          text: text.slice(0, 1200),
          voice: MIRA_HUME_VOICE,
        },
      ],
    })

    const generation = speech.generations?.[0]
    const audio =
      generation?.audio ||
      generation?.snippets?.flat().map((s) => s.audio).filter(Boolean).join('') ||
      ''

    if (!audio) {
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 })
    }

    return NextResponse.json({ audio, format: 'mp3' })
  } catch (error) {
    console.error('POST /api/hume/tts', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 },
    )
  }
}
