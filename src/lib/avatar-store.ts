import { promises as fs } from 'fs'
import path from 'path'
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase/server'

const LOCAL_DIR = path.join(process.cwd(), '.data', 'avatars')
const BUCKET = 'mira-avatars'

function isVercel() {
  return Boolean(process.env.VERCEL)
}

function avatarObjectKey(guestId: string) {
  return `${guestId}/avatar.png`
}

function personaObjectKey(guestId: string, pathwayId: string) {
  return `${guestId}/personas/${pathwayId}.png`
}

function localAvatarPath(guestId: string) {
  return path.join(LOCAL_DIR, `${guestId}.png`)
}

function localPersonaPath(guestId: string, pathwayId: string) {
  return path.join(LOCAL_DIR, 'personas', guestId, `${pathwayId}.png`)
}

async function ensureLocalDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : ''
    if (code === 'EROFS' || code === 'EACCES' || isVercel()) {
      throw new Error(
        'Avatar storage is not writable on Vercel. Add Supabase env vars and create the mira-avatars storage bucket (see supabase/schema.sql).',
      )
    }
    throw error
  }
}

async function uploadToSupabase(objectKey: string, bytes: Buffer) {
  const sb = getServiceSupabase()
  if (!sb) throw new Error('Supabase is not configured.')

  const { error } = await sb.storage.from(BUCKET).upload(objectKey, bytes, {
    contentType: 'image/png',
    upsert: true,
  })
  if (error) {
    // Common first-deploy miss: bucket not created yet.
    if (/bucket|not found|does not exist/i.test(error.message)) {
      throw new Error(
        `Supabase Storage bucket "${BUCKET}" is missing. Run the storage section of supabase/schema.sql, then retry.`,
      )
    }
    throw new Error(error.message)
  }
}

async function downloadFromSupabase(objectKey: string): Promise<Buffer | null> {
  const sb = getServiceSupabase()
  if (!sb) return null
  const { data, error } = await sb.storage.from(BUCKET).download(objectKey)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

async function removeFromSupabase(objectKey: string) {
  const sb = getServiceSupabase()
  if (!sb) return
  await sb.storage.from(BUCKET).remove([objectKey])
}

async function listAndRemovePrefix(prefix: string) {
  const sb = getServiceSupabase()
  if (!sb) return
  const { data } = await sb.storage.from(BUCKET).list(prefix, { limit: 100 })
  if (!data?.length) return
  const paths = data.map((f) => `${prefix}/${f.name}`)
  if (paths.length) await sb.storage.from(BUCKET).remove(paths)
}

export function avatarStorageMode(): 'supabase' | 'local' {
  return isSupabaseConfigured() ? 'supabase' : 'local'
}

export async function storeHasAvatar(guestId: string) {
  const buf = await storeReadAvatar(guestId)
  return Boolean(buf)
}

export async function storeReadAvatar(guestId: string): Promise<Buffer | null> {
  if (isSupabaseConfigured()) {
    return downloadFromSupabase(avatarObjectKey(guestId))
  }
  if (isVercel()) return null
  try {
    return await fs.readFile(localAvatarPath(guestId))
  } catch {
    return null
  }
}

export async function storeWriteAvatar(guestId: string, bytes: Buffer) {
  if (isSupabaseConfigured()) {
    await uploadToSupabase(avatarObjectKey(guestId), bytes)
    return
  }
  if (isVercel()) {
    throw new Error(
      'Avatar uploads need Supabase on Vercel. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and create the mira-avatars bucket.',
    )
  }
  await ensureLocalDir(LOCAL_DIR)
  await fs.writeFile(localAvatarPath(guestId), bytes)
}

export async function storeDeleteAvatar(guestId: string) {
  if (isSupabaseConfigured()) {
    await removeFromSupabase(avatarObjectKey(guestId))
    await listAndRemovePrefix(`${guestId}/personas`)
    return
  }
  if (isVercel()) return
  try {
    await fs.unlink(localAvatarPath(guestId))
  } catch {
    /* gone */
  }
  try {
    await fs.rm(path.join(LOCAL_DIR, 'personas', guestId), { recursive: true, force: true })
  } catch {
    /* gone */
  }
}

export async function storeHasPersona(guestId: string, pathwayId: string) {
  const buf = await storeReadPersona(guestId, pathwayId)
  return Boolean(buf)
}

export async function storeReadPersona(
  guestId: string,
  pathwayId: string,
): Promise<Buffer | null> {
  if (isSupabaseConfigured()) {
    return downloadFromSupabase(personaObjectKey(guestId, pathwayId))
  }
  if (isVercel()) return null
  try {
    return await fs.readFile(localPersonaPath(guestId, pathwayId))
  } catch {
    return null
  }
}

export async function storeWritePersona(
  guestId: string,
  pathwayId: string,
  bytes: Buffer,
) {
  if (isSupabaseConfigured()) {
    await uploadToSupabase(personaObjectKey(guestId, pathwayId), bytes)
    return
  }
  if (isVercel()) {
    throw new Error(
      'Persona images need Supabase Storage on Vercel. Configure Supabase and create the mira-avatars bucket.',
    )
  }
  const dir = path.join(LOCAL_DIR, 'personas', guestId)
  await ensureLocalDir(dir)
  await fs.writeFile(localPersonaPath(guestId, pathwayId), bytes)
}
