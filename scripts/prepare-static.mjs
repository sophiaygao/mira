/**
 * Build a GeminiLaunch-ready static Mira app:
 *   dist/index.html  (+ css/js/favicon at the same level)
 * Optional: --zip → mira-geminilaunch.zip with index.html at archive root.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'static-site')
const distDir = path.join(root, 'dist')
const zipPath = path.join(root, 'mira-geminilaunch.zip')
const wantZip = process.argv.includes('--zip')
const faviconSrc = path.join(root, 'public', 'favicon.svg')

if (!existsSync(path.join(srcDir, 'index.html'))) {
  console.error('Missing static-site/index.html')
  process.exit(1)
}

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })
cpSync(srcDir, distDir, { recursive: true })

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

console.log('Prepared static Mira app in dist/ (index.html at top level):')
for (const name of ['index.html', 'styles.css', 'app.js', 'mira-engine.js', 'favicon.svg']) {
  console.log(`  dist/${name}`)
}

if (!wantZip) {
  console.log('\nZip for GeminiLaunch:')
  console.log('  npm run zip:geminilaunch')
  console.log('\nUpload dist/ folder or mira-geminilaunch.zip — not the parent mira/ repo.')
  process.exit(0)
}

rmSync(zipPath, { force: true })
const zipped = spawnSync('zip', ['-r', '-X', zipPath, '.', '-x', '*.DS_Store'], {
  cwd: distDir,
  encoding: 'utf8',
})
if (zipped.status !== 0) {
  console.error(zipped.stderr || 'zip failed')
  process.exit(1)
}

console.log(`\nCreated ${path.relative(root, zipPath)}`)
console.log('Archive root includes index.html — ready for GeminiLaunch.')
