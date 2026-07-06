#!/usr/bin/env node
// @jerry-271828/claude-code — HarmonyOS PC (OpenHarmony) launcher.
// Self-bootstrapping: first run downloads the @cometix platform tarball
// and sets up cli.js + vendor/. Subsequent runs skip straight to startup.
// Contains no Anthropic or Cometix code.

import { existsSync, mkdirSync, statSync, copyFileSync } from 'node:fs'
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir, platform } from 'node:os'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { pipeline } from 'node:stream/promises'
import { get } from 'node:https'
import { createWriteStream } from 'node:fs'

const require = createRequire(import.meta.url)

// --- OHOS detection ---
const isOhos = platform() === 'openharmony' || existsSync('/data/storage/el2/base')

// --- Bootstrap: ensure @cometix/claude-code/cli.js is the full version ---
// cometix's postinstall can't detect OHOS (platform key 'openharmony-arm64'
// doesn't match any PLATFORMS entry), and npm skips its platform optionalDep
// (os field says 'linux'). We fill the gap here on first launch.
async function bootstrap() {
  let cometixDir
  try {
    cometixDir = dirname(require.resolve('@cometix/claude-code/package.json'))
  } catch {
    console.error('claude-code-ohos: @cometix/claude-code is not installed.')
    console.error('  Install it first: npm install @cometix/claude-code')
    process.exit(1)
  }

  const cliPath = join(cometixDir, 'cli.js')
  const markerPath = join(cometixDir, '.ohos-bootstrap-version')

  // Check if already bootstrapped for the current version.
  let version, alreadyDone = false
  try {
    version = require('@cometix/claude-code/package.json').version
    if (existsSync(cliPath) && statSync(cliPath).size > 1_000_000) {
      if (existsSync(markerPath)) {
        const marker = (await readFile(markerPath, 'utf8')).trim()
        if (marker === version) alreadyDone = true
      }
    }
  } catch {}
  if (alreadyDone) return

  console.log(`[claude-code-ohos] First launch — setting up platform files (v${version})...`)

  // Find tar (try PATH first, then common locations).
  let tar
  try { execFileSync('tar', ['--version'], { stdio: 'pipe' }); tar = 'tar' } catch {}
  for (const p of ['/bin/tar', '/usr/bin/tar']) {
    if (tar) break
    if (existsSync(p)) tar = p
  }
  if (!tar) {
    console.error('[claude-code-ohos] tar not found. Install it:')
    console.error('  brew install devel-base   # or: opkg install tar')
    process.exit(1)
  }

  // Download the musl platform tarball.
  const registry = process.env.npm_config_registry || 'https://registry.npmjs.org'
  const url = `${registry}/@cometix/claude-code-linux-arm64-musl/-/claude-code-linux-arm64-musl-${version}.tgz`
  const tmpDir = join(tmpdir(), 'cc-ohos-' + Date.now())

  try {
    await mkdir(tmpDir, { recursive: true })
    const tarball = join(tmpDir, 'pkg.tgz')

    // Download (follow one redirect).
    await new Promise((resolve, reject) => {
      get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location, (r2) => {
            pipeline(r2, createWriteStream(tarball)).then(resolve, reject)
          }).on('error', reject)
          res.resume()
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        pipeline(res, createWriteStream(tarball)).then(resolve, reject)
      }).on('error', reject)
    })

    // Extract.
    execFileSync(tar, ['xzf', tarball, '-C', tmpDir], { stdio: 'pipe' })

    // Copy cli.js + vendor/ into cometix directory.
    const src = join(tmpDir, 'package')
    copyFileSync(join(src, 'cli.js'), cliPath)
    if (existsSync(join(src, 'vendor'))) {
      await cp(join(src, 'vendor'), join(cometixDir, 'vendor'), { recursive: true, force: true })
    }

    await writeFile(markerPath, version + '\n')
    console.log('[claude-code-ohos] Platform files ready.')
  } catch (err) {
    console.error(`[claude-code-ohos] Bootstrap failed: ${err.message}`)
    console.error('[claude-code-ohos] Try:')
    console.error(`  npm i --ignore-platform @cometix/claude-code-linux-arm64-musl@${version || 'latest'}`)
    console.error('  Then copy cli.js and vendor/ from there into @cometix/claude-code/')
    process.exit(1)
  } finally {
    try { await rm(tmpDir, { recursive: true, force: true }) } catch {}
  }
}

// --- Main ---
if (isOhos) {
  // /storage/Users/... is a FUSE mount whose stat uid doesn't match
  // process uid, so Claude Code's tmpdir ownership check always fails.
  // /data/storage/el2/base/cache is the app sandbox's real ext4.
  if (!process.env.CLAUDE_CODE_TMPDIR) {
    const tmp = '/data/storage/el2/base/cache/claude-tmp'
    try { mkdirSync(tmp, { recursive: true }) } catch {}
    process.env.CLAUDE_CODE_TMPDIR = tmp
  }

  // Vendored ripgrep is PIE but unsigned — OHOS kernel requires a valid
  // .codesign section. Use the system rg from harmonybrew instead.
  if (process.env.USE_BUILTIN_RIPGREP === undefined) {
    process.env.USE_BUILTIN_RIPGREP = '0'
  }

  // Newer upstream releases are native-binary-only (non-PIE, no OHOS
  // platform package). Disable the auto-updater.
  if (process.env.DISABLE_AUTOUPDATER === undefined) {
    process.env.DISABLE_AUTOUPDATER = '1'
  }
}

if (isOhos) await bootstrap()

const cli = require.resolve('@cometix/claude-code/cli.js')
await import('node:url').then(m => import(m.pathToFileURL(cli).href))
