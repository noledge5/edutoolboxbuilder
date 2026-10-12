#!/bin/bash
# Before Claude ends a turn with uncommitted code changes: run the tests.
# A failure sends Claude back to fix it (once per turn, guarded by stop_hook_active).
input=$(cat)
[ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || exit 0
changed=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null | grep -E '^(src|a)/|\.(ts|tsx|md)$' )
[ -z "$changed" ] && exit 0
out=$(npm test --silent 2>&1)
if [ $? -ne 0 ]; then
  echo "Tests fail with the current changes. Fix them (after changing blocks, fields or icons: npm run anleitung) before finishing:" >&2
  echo "$out" | grep -E 'FAIL|✗|×|Error|expected' | head -30 >&2
  exit 2
fi
exit 0
