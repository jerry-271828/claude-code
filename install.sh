#!/usr/bin/env sh
set -e

# install.sh — install @jerry-271828/claude-code on HarmonyOS PC
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/jerry-271828/claude-code/main/install.sh | sh
#
# Or clone first, then run locally:
#   git clone https://github.com/jerry-271828/claude-code.git
#   cd claude-code && sh install.sh

INSTALL_DIR="${CLAUDE_CODE_OHOS_HOME:-$HOME/.claude-code-ohos}"
REPO_URL="https://github.com/jerry-271828/claude-code.git"

echo "==> Installing @jerry-271828/claude-code..."
echo "    Install dir: $INSTALL_DIR"

# Check prerequisites
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required. Install Node.js >= 22 via Harmonybrew:"
  echo "  brew install node"
  exit 1
fi

if ! command -v rg >/dev/null 2>&1; then
  echo "WARNING: ripgrep (rg) not found. Claude Code search will not work."
  echo "  Install it: brew install ripgrep"
fi

NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ] 2>/dev/null; then
  echo "WARNING: Node.js >= 22 recommended (current: v$NODE_VERSION)"
fi

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "==> Updating existing install..."
  cd "$INSTALL_DIR"
  git pull --ff-only
else
  echo "==> Cloning repository..."
  rm -rf "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Install dependencies (skip scripts — OHOS can't spawn sh for node-gyp)
echo "==> Installing dependencies..."
npm install --ignore-scripts --no-audit --no-fund

# Run cometix postinstall (platform detection + copy cli.js + vendor/)
echo "==> Setting up @cometix/claude-code platform files..."
cd "$INSTALL_DIR/node_modules/@cometix/claude-code"
node install.cjs || echo "    (cometix postinstall skipped — will be handled at first launch)"
cd "$INSTALL_DIR"

# Run our postinstall
echo "==> Running @jerry-271828/claude-code postinstall..."
node scripts/postinstall.mjs || true

# Register the `claude` command.
# OHOS kernel requires code signatures on every exec'd file — even shebang
# scripts. We can't create an executable claude.js and have it work.
# The workaround: add a shell alias that runs `node <script>`.
# `node` is signed (installed by harmonybrew); our .mjs file is just an
# argument to it, not exec'd directly.
CLAUDE_SCRIPT="$INSTALL_DIR/bin/claude.mjs"
ALIAS_LINE="alias claude='node $CLAUDE_SCRIPT'"
ZSHRC="$HOME/.zshrc"

echo "==> Registering claude command..."

# Remove any previous alias line
if [ -f "$ZSHRC" ]; then
  sed -i '/^alias claude=.claude-code-ohos/d' "$ZSHRC"
fi

echo "$ALIAS_LINE" >> "$ZSHRC"
echo "    Added alias to ~/.zshrc"

# Also make it available in the current shell
eval "$ALIAS_LINE"

# Clean up previous npm link if present
npm rm -g @jerry-271828/claude-code 2>/dev/null || true

echo ""
echo "==> Done! Run: claude"
echo ""
echo "    (If 'claude' is not found, open a new terminal or run:"
echo "     source ~/.zshrc)"
echo ""
echo "    First launch will download ~8MB of platform files."
echo "    Subsequent launches skip straight to Claude Code."
