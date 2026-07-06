// @jerry-271828/claude-code postinstall
// On OHOS, the real bootstrap happens at first `claude` launch —
// bin/claude.mjs downloads the platform tarball on demand.
// This script is just a friendly hint for users who CAN run scripts.
if (process.platform === 'openharmony') {
  console.log('[claude-code-ohos] OHOS detected — first launch will complete setup.')
}
process.exit(0)
