import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rootIndex = path.join(root, 'index.html')
const distDir = path.join(root, 'dist')
const distIndex = path.join(distDir, 'index.html')
const nextIndex = path.join(root, '.next', 'server', 'app', 'index.html')

if (!existsSync(rootIndex)) {
  console.error('Missing root index.html — expected at project root.')
  process.exit(1)
}

mkdirSync(distDir, { recursive: true })

// Prefer the freshly built Next page when present; otherwise keep the root file.
const source = existsSync(nextIndex) ? nextIndex : rootIndex
copyFileSync(source, distIndex)

// Always keep a stable entry at repo root (handcrafted landing).
if (source !== rootIndex) {
  // Next's RSC HTML is for dist/; root stays the committed static entry.
  console.log(`Kept ${path.relative(root, rootIndex)}`)
  console.log(`Wrote ${path.relative(root, distIndex)} from Next build`)
} else {
  console.log(`Wrote ${path.relative(root, distIndex)} from root index.html`)
}
