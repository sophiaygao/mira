/**
 * Build a GeminiLaunch-ready static folder:
 *   dist/
 *     index.html   ← top level
 *     favicon.svg
 *
 * Then optionally zip so index.html is at the archive root (not nested).
 */
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const rootIndex = path.join(root, 'index.html')
const faviconSrc = path.join(root, 'public', 'favicon.svg')
const zipPath = path.join(root, 'mira-geminilaunch.zip')
const wantZip = process.argv.includes('--zip')

if (!existsSync(rootIndex)) {
  console.error('Missing index.html at project root.')
  process.exit(1)
}

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })
copyFileSync(rootIndex, path.join(distDir, 'index.html'))

if (existsSync(faviconSrc)) {
  copyFileSync(faviconSrc, path.join(distDir, 'favicon.svg'))
} else {
  writeFileSync(
    path.join(distDir, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <circle cx="16" cy="16" r="14" fill="#789387"/>
  <circle cx="16" cy="16" r="7" fill="none" stroke="#E8F0ED" stroke-width="1.5" opacity="0.9"/>
  <circle cx="16" cy="16" r="2.5" fill="#E8F0ED"/>
</svg>
`,
  )
}

console.log('Prepared dist/ with index.html at top level:')
console.log('  dist/index.html')
console.log('  dist/favicon.svg')

if (!wantZip) {
  console.log('\nNext: zip dist contents (index.html at zip root), then upload to GeminiLaunch:')
  console.log('  npm run zip:geminilaunch')
  console.log('\nOr upload the dist/ folder itself (not the parent mira/ folder).')
  process.exit(0)
}

rmSync(zipPath, { force: true })

// Zip *contents* of dist so the archive root is index.html (no wrapper folder).
const zip = spawnSync(
  'ditto',
  ['-c', '-k', '--sequesterRsrc', '--keepParent', distDir, zipPath],
  { encoding: 'utf8' },
)

// ditto --keepParent nests dist/ — GeminiLaunch may unwrap one level, but
// instructions say avoid that. Prefer zip of contents via cd + zip.
rmSync(zipPath, { force: true })

const zipContents = spawnSync(
  'zip',
  ['-r', '-X', zipPath, '.', '-x', '*.DS_Store'],
  { cwd: distDir, encoding: 'utf8' },
)

if (zipContents.status !== 0) {
  console.error(zipContents.stderr || zip.stderr || 'zip failed')
  console.error('Install zip, or manually: cd dist && zip -r ../mira-geminilaunch.zip .')
  process.exit(1)
}

console.log(`\nCreated ${path.relative(root, zipPath)}`)
console.log('Archive root has index.html — ready for GeminiLaunch upload.')
