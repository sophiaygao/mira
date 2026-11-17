import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { toFile } from 'openai'
import { getOpenAIImages } from './openai'

const AVATAR_DIR = path.join(process.cwd(), '.data', 'avatars')
const PERSONA_DIR = path.join(AVATAR_DIR, 'personas')

/** Flat key color for silhouette cutouts (models may not support transparent output). */
const CHROMA = { r: 255, g: 0, b: 255 } as const
const CHROMA_HEX = '#FF00FF'

const PET_IP_PROMPT = `Transform the main subject in this photo into ONE original Mira companion character — a mistkin head on a Fuggler-like plush body.

HEAD (keep Mira mistkin style — do NOT make a Fuggler face):
- Soft clay-plush face with handmade charm
- Eyes: small embroidered or glazed beads — calm, curious, a little asymmetrical; never plastic googly buttons
- Mouth: a soft stitched curve or tiny thoughtful pout — closed or barely open
- NO realistic human teeth, NO gums, NO wide toothy grimace
- Expression: contemplative, warm, lovably odd — reflective companion energy
- Keep recognizable hair color/shape, skin tone, and face vibe from the subject
- Optional tiny head detail (hair tuft, glasses hint, dewdrop / mirror-shard charm)

BODY (Fuggler-style plush monster proportions):
- Squat, chunky, stubby arms and legs; soft stuffed-toy silhouette
- Pear-shaped or rounded rectangular torso with oversized plush volume
- Fuzzy / fleece / felt fabric textures, visible seams, handmade stuffed-animal energy
- Short limbs that look comically stubby relative to the big body
- Quiet pastel mist, sage, linen, blush, and sea-glass tones mixed with the subject’s clothing / accent colors
- Optional tiny patterned underpants or a simple fabric scrap if it fits — playful, not crude
- No brand logos, no text, no watermark

Preserve enough identity so it still feels like “them,” remade as this hybrid companion.

Fill the entire background with a flat solid chroma key of exactly ${CHROMA_HEX} (hot magenta) — no gradients, no shadows on the backdrop, no other background colors. Keep magenta OUT of the character itself.

Output: a single full-body character cutout. No grid, no multiple characters, no square frame, no circle crop, no photoreal photo of a person.`

export function avatarPath(guestId: string) {
  return path.join(AVATAR_DIR, `${guestId}.png`)
}

export async function hasAvatar(guestId: string) {
  try {
    await fs.access(avatarPath(guestId))
    return true
  } catch {
    return false
  }
}

export async function readAvatar(guestId: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(avatarPath(guestId))
  } catch {
    return null
  }
}

export async function deleteAvatar(guestId: string) {
  try {
    await fs.unlink(avatarPath(guestId))
  } catch {
    /* already gone */
  }
  await deleteGuestPersonas(guestId)
}

export function personaPath(guestId: string, pathwayId: string) {
  return path.join(PERSONA_DIR, guestId, `${pathwayId}.png`)
}

export function personaUrl(pathwayId: string) {
  return `/api/avatar/persona/${pathwayId}`
}

export async function hasPersona(guestId: string, pathwayId: string) {
  try {
    await fs.access(personaPath(guestId, pathwayId))
    return true
  } catch {
    return false
  }
}

export async function readPersona(guestId: string, pathwayId: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(personaPath(guestId, pathwayId))
  } catch {
    return null
  }
}

export async function deleteGuestPersonas(guestId: string) {
  const dir = path.join(PERSONA_DIR, guestId)
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch {
    /* already gone */
  }
}

function personaPrompt(title: string, description: string) {
  const blurb = description.trim().slice(0, 280)
  return `Image is the user's Mira companion avatar (mistkin head + stubby plush body).

Create ONE wardrobe / lifestyle persona variant of THIS SAME character living the future called "${title}".
Context: ${blurb}

KEEP identical:
- Same face, hair color/shape, skin tone, mistkin head style (soft stitched mouth, bead eyes — NO realistic teeth)
- Same Fuggler-like squat plush body proportions and overall identity

CHANGE only:
- Outfit, accessories, hair extras (hat, clip, ponytail, glasses style), and small props that express this future lifestyle
- Color accents that fit the persona, still soft pastels

Full-body single character. Fill the entire background with flat solid chroma ${CHROMA_HEX}. Keep magenta OUT of the character. No text, logos, watermark, grid, or photoreal person.`
}

/** Restyle the guest avatar into a pathway persona cutout. */
export async function generatePathwayPersona(args: {
  guestId: string
  pathwayId: string
  title: string
  description: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const client = getOpenAIImages()
  if (!client) {
    return { ok: false, error: 'Add OPENAI_API_KEY to enable pathway personas.' }
  }

  const source = await readAvatar(args.guestId)
  if (!source) {
    return { ok: false, error: 'Upload a companion avatar first.' }
  }

  if (await hasPersona(args.guestId, args.pathwayId)) {
    return {
      ok: true,
      url: `${personaUrl(args.pathwayId)}?t=${Date.now()}`,
    }
  }

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2'
  const quality =
    (process.env.OPENAI_IMAGE_QUALITY?.trim() as 'low' | 'medium' | 'high' | undefined) ||
    'low'

  try {
    const prepared = await prepareSubjectImage(source)
    const subject = await toFile(prepared, 'companion.png', { type: 'image/jpeg' })

    const result = await client.images.edit({
      model,
      image: subject,
      prompt: personaPrompt(args.title, args.description),
      size: '1024x1024',
      quality,
      output_format: 'png',
      background: 'opaque',
      n: 1,
      ...(model.includes('1.5') || model.includes('gpt-image-1-mini')
        ? { input_fidelity: 'high' as const }
        : {}),
    })

    const b64 = 'data' in result ? result.data?.[0]?.b64_json : undefined
    if (!b64) {
      return { ok: false, error: 'The image model returned an empty persona.' }
    }

    const cutout = await cutoutChromaKey(Buffer.from(b64, 'base64'))
    await fs.mkdir(path.join(PERSONA_DIR, args.guestId), { recursive: true })
    await fs.writeFile(personaPath(args.guestId, args.pathwayId), cutout)
    return {
      ok: true,
      url: `${personaUrl(args.pathwayId)}?t=${Date.now()}`,
    }
  } catch (error) {
    console.error('generatePathwayPersona', error)
    return { ok: false, error: friendlyImageError(error) }
  }
}

export async function ensurePathwayPersonas(
  guestId: string,
  pathways: { id: string; title: string; description: string }[],
): Promise<Record<string, string>> {
  if (!(await hasAvatar(guestId))) return {}

  const results = await Promise.all(
    pathways.map(async (p) => {
      const result = await generatePathwayPersona({
        guestId,
        pathwayId: p.id,
        title: p.title,
        description: p.description,
      })
      return [p.id, result] as const
    }),
  )

  const map: Record<string, string> = {}
  for (const [id, result] of results) {
    if (result.ok) map[id] = result.url
  }
  return map
}

/** Knock out near-magenta backdrop so the pet renders as a silhouette. */
async function cutoutChromaKey(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const px = data
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const dr = r - CHROMA.r
    const dg = g - CHROMA.g
    const db = b - CHROMA.b
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    // Magenta-ish + fairly saturated → transparent; soft edge for fuzz.
    const magentaBias = r - Math.max(g, b)
    if (dist < 78 || (magentaBias > 70 && r > 160 && g < 120 && b > 120)) {
      px[i + 3] = 0
    } else if (dist < 110 || (magentaBias > 45 && r > 140)) {
      px[i + 3] = Math.min(px[i + 3], Math.round(((dist - 78) / 32) * 255))
    }
  }

  return sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

/** Shrink uploads so image edits connect/finish faster. */
async function prepareSubjectImage(image: Buffer) {
  return sharp(image)
    .rotate()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

function friendlyImageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const cause =
    error && typeof error === 'object' && 'cause' in error
      ? String((error as { cause?: unknown }).cause)
      : ''
  const blob = `${message} ${cause}`
  if (/timed out|timeout|UND_ERR_CONNECT|fetch failed/i.test(blob)) {
    return 'Avatar generation timed out reaching OpenAI. Check your network/VPN, then try again.'
  }
  return message || 'Could not create companion avatar'
}

export async function generateCompanionAvatar(args: {
  guestId: string
  image: Buffer
  filename: string
  mimeType: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const client = getOpenAIImages()
  if (!client) {
    return { ok: false, error: 'Add OPENAI_API_KEY to enable companion avatars.' }
  }

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2'
  const quality =
    (process.env.OPENAI_IMAGE_QUALITY?.trim() as 'low' | 'medium' | 'high' | undefined) ||
    'low'

  try {
    const prepared = await prepareSubjectImage(args.image)
    const subject = await toFile(prepared, 'selfie.jpg', { type: 'image/jpeg' })

    // gpt-image-2 often rejects background:"transparent" — generate opaque magenta
    // key, then punch it out ourselves so the floating pet stays a silhouette.
    const result = await client.images.edit({
      model,
      image: subject,
      prompt: PET_IP_PROMPT,
      size: '1024x1024',
      quality,
      output_format: 'png',
      background: 'opaque',
      n: 1,
      // Face-preserving fidelity is supported on gpt-image-1.5 (not gpt-image-2).
      ...(model.includes('1.5') || model.includes('gpt-image-1-mini')
        ? { input_fidelity: 'high' as const }
        : {}),
    })

    const b64 = 'data' in result ? result.data?.[0]?.b64_json : undefined
    if (!b64) {
      return { ok: false, error: 'The image model returned an empty result.' }
    }

    const cutout = await cutoutChromaKey(Buffer.from(b64, 'base64'))

    await fs.mkdir(AVATAR_DIR, { recursive: true })
    await fs.writeFile(avatarPath(args.guestId), cutout)
    return { ok: true, url: `/api/avatar?t=${Date.now()}` }
  } catch (error) {
    console.error('generateCompanionAvatar', error)
    return { ok: false, error: friendlyImageError(error) }
  }
}
