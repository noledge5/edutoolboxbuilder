#!/bin/bash
# After an edit to a .ts/.tsx file: run the typechecker and hand errors back to Claude.
# The project's own tsc, incremental: about a second per edit (npx added several seconds). The cache lives in node_modules.
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || exit 0
mkdir -p node_modules/.cache
out=$(node_modules/.bin/tsc --noEmit --incremental --tsBuildInfoFile node_modules/.cache/tsc-hook.tsbuildinfo 2>&1)
if [ $? -ne 0 ]; then
  echo "Typecheck failed after editing $file:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi
exit 0
