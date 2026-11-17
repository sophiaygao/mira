/**
 * Keep a browser-ready static entry in dist/ for GeminiLaunch / Drop hosts.
 * Do NOT copy Next.js RSC HTML here — it blanks without the Node server.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'prepare-static.mjs')], {
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
