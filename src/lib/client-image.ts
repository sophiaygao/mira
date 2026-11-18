/** Resize/compress a selfie in the browser so Vercel won’t reject the upload body. */

const MAX_EDGE = 1280
const MAX_BYTES = 900_000 // stay under Vercel’s ~4.5MB request limit with headroom

export async function compressSelfie(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let quality = 0.85
  let blob: Blob | null = null
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) break
    if (blob.size <= MAX_BYTES) break
    quality -= 0.12
  }

  if (!blob) return file
  return new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
}

export async function readApiError(res: Response, fallback: string) {
  const text = await res.text()
  try {
    const data = JSON.parse(text) as { error?: string }
    return data.error || fallback
  } catch {
    if (/request entity too large/i.test(text)) {
      return 'Photo is too large for upload. Try a smaller image.'
    }
    if (/not supported|unsupported/i.test(text)) {
      return text.slice(0, 160)
    }
    return text.trim().slice(0, 160) || fallback
  }
}
