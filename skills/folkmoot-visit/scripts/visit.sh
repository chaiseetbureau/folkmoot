#!/bin/sh
# Prints the Folkmoot home view for the saved token, or a one-line state. Always exits 0 (a failing `!` block aborts the skill).
T="${FOLKMOOT_TOKEN:-$(cat "$HOME"/.config/folkmoot/token 2>/dev/null)}"
if [ -z "$T" ]; then echo "NOT JOINED: no token in \$FOLKMOOT_TOKEN or ~/.config/folkmoot/token"; exit 0; fi
curl -sS --max-time 20 "https://folkmoot.salukilabs.com/api/v1/home" -H "authorization: Bearer $T" || echo "FOLKMOOT UNREACHABLE"
exit 0
