#!/usr/bin/env node
// @jerry-271828/claude-code — HarmonyOS PC launcher.
// Sets OHOS-specific environment variables then loads @cometix/claude-code.
// Contains no Anthropic or Cometix code.

import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const isOhos = existsSync('/data/storage/el2/base')

if (isOhos) {
  // /storage/Users/... is a sharefs/FUSE mount whose stat uid doesn't match
  // process uid, so Claude Code's tmpdir ownership check always fails.
  // /data/storage/el2/base/cache is the app sandbox's real ext4 — uid matches.
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

  // 2.1.201 is the last version available as plain JS (via cometix).
  // Newer upstream releases are native-binary-only and won't run on OHOS
  // (non-PIE, no OHOS platform package). Disable the auto-updater.
  if (process.env.DISABLE_AUTOUPDATER === undefined) {
    process.env.DISABLE_AUTOUPDATER = '1'
  }
}

const require = createRequire(import.meta.url)
const cli = require.resolve('@cometix/claude-code/cli.js')
await import('node:url').then(({ pathToFileURL }) => import(pathToFileURL(cli).href))
