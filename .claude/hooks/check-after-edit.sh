#!/bin/bash
# After an edit to a source file: run the fast check and hand errors back to Claude (exit 2).
# Adapted to this repo: the project's own TypeScript compiler, incremental (about a second per edit; npx would add
# several seconds). The build cache lives in node_modules, not in the repo.
CHECK="node_modules/.bin/tsc --noEmit --incremental --tsBuildInfoFile node_modules/.cache/tsc-hook.tsbuildinfo"
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || exit 0
mkdir -p node_modules/.cache
out=$($CHECK 2>&1)
if [ $? -ne 0 ]; then
  echo "Check failed after editing $file:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi
exit 0
