#!/bin/bash
# ============================================================
#  Scripture Game - BERESHITH  (Linux launcher)
#  Opens the game in your default browser. Fully OFFLINE.
#  If needed, make it executable once:
#      chmod +x start-linux.sh
# ============================================================
cd "$(dirname "$0")" || exit 1
xdg-open "index.html" >/dev/null 2>&1 &
