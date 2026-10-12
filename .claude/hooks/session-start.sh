#!/bin/bash
# Installs dependencies in a fresh checkout (cloud sessions start without node_modules),
# so typecheck, tests and the hooks below work from the first turn.
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1
fi
exit 0
