#!/usr/bin/env node
// @jerry-271828/claude-code postinstall
//
// On HarmonyOS, @cometix/claude-code's own postinstall can't detect the
// platform (process.platform === 'openharmony' doesn't match any of its
// PLATFORMS entries), and npm skips @cometix/claude-code-linux-arm64-musl
// because that package's os field says 'linux'.
//
// This script plugs the gap: download the musl platform tarball from the
// npm registry and extract cli.js + vendor/ into @cometix/claude-code.

import { existsSync, mkdirSync, createWriteStream, copyFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { pipeline } from 'node:stream/promises'
import { get } from 'node:https'

const require = createRequire(import.meta.url)

if (process.platform !== 'openharmony') process.exit(0)

let version
try {
  version = require('@cometix/claude-code/package.json').version
} catch {
  process.exit(0)
}

const cometixDir = dirname(require.resolve('@cometix/claude-code/package.json'))
const cliPath = join(cometixDir, 'cli.js')

// If cometix's postinstall already succeeded, skip.
try {
  if (existsSync(cliPath) && (await import('node:fs/promises')).stat(cliPath).then(s => s.size > 1_000_000)) {
    process.exit(0)
  }
} catch {}

console.log(`[claude-code-ohos] Installing platform files for v${version}...`)

const registry = process.env.npm_config_registry || 'https://registry.npmjs.org'
const url = `${registry}/@cometix/claude-code-linux-arm64-musl/-/claude-code-linux-arm64-musl-${version}.tgz`
const tmpDir = join(tmpdir(), 'cc-ohos-' + Date.now())
const tarball = join(tmpDir, 'pkg.tgz')

try {
  await mkdir(tmpDir, { recursive: true })

  // Download the tarball (follow one redirect).
  const dl = (u) => new Promise((resolve, reject) => {
    get(u, (res) => {
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
  await dl(url)

  // Extract everything, then copy what we need.
  execFileSync('tar', ['xzf', tarball, '-C', tmpDir], { stdio: 'pipe' })

  const srcDir = join(tmpDir, 'package')
  copyFileSync(join(srcDir, 'cli.js'), cliPath)
  console.log('[claude-code-ohos] cli.js installed')

  if (existsSync(join(srcDir, 'vendor'))) {
    execFileSync('cp', ['-a', join(srcDir, 'vendor'), join(cometixDir, 'vendor')], { stdio: 'pipe' })
    console.log('[claude-code-ohos] vendor/ installed')
  }

  // Fix node-pty spawn-helper +x (npm strips it).
  try {
    const { chmodSync, readdirSync } = await import('node:fs')
    for (const base of [join(cometixDir, 'node_modules', 'node-pty', 'prebuilds'), join(cometixDir, '..', 'node-pty', 'prebuilds')]) {
      if (!existsSync(base)) continue
      for (const plat of readdirSync(base)) {
        const h = join(base, plat, 'spawn-helper')
        if (existsSync(h)) chmodSync(h, 0o755)
      }
    }
  } catch {}
} catch (err) {
  console.error(`[claude-code-ohos] Platform install failed: ${err.message}`)
  console.error('[claude-code-ohos] Try: npm i --ignore-platform @cometix/claude-code-linux-arm64-musl')
} finally {
  try { execFileSync('rm', ['-rf', tmpDir], { stdio: 'pipe' }) } catch {}
}
process.exit(0)
