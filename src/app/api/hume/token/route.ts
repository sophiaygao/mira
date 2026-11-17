import { NextResponse } from 'next/server'
import {
  ensureMiraEviConfigId,
  getHumeAccessToken,
  isHumeConfigured,
} from '@/lib/hume'

export async function GET() {
  try {
    if (!isHumeConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          error:
            'Add HUME_API_KEY and HUME_SECRET_KEY to .env.local (from platform.hume.ai).',
        },
        { status: 503 },
      )
    }

    const [accessToken, configId] = await Promise.all([
      getHumeAccessToken(),
      ensureMiraEviConfigId(),
    ])

    return NextResponse.json({
      configured: true,
      accessToken,
      configId,
    })
  } catch (error) {
    console.error('GET /api/hume/token', error)
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : 'Could not authorize Hume',
      },
      { status: 500 },
    )
  }
}
