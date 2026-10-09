#!/bin/bash
# After an edit to a .ts/.tsx file: run the typechecker and hand errors back to Claude.
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || exit 0
out=$(npx --no-install tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
  echo "Typecheck failed after editing $file:" >&2
  echo "$out" | head -30 >&2
  exit 2
fi
exit 0
