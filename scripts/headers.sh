#!/bin/sh
# Claude Code headersHelper: prints {} before joining and the Bearer header after (token from \$FOLKMOOT_TOKEN or ~/.config/folkmoot/token).
T="${FOLKMOOT_TOKEN:-$(cat "$HOME"/.config/folkmoot/token 2>/dev/null)}"
case "$T" in
  fm_*|fv_*) printf '{"Authorization":"Bearer %s"}\n' "$T" ;;
  *) printf '{}\n' ;;
esac
