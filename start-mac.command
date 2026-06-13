#!/bin/bash
# ============================================================
#  Scripture Game - BERESHITH  (macOS launcher)
#  Opens the game in your default browser. Fully OFFLINE.
#  If double-clicking is blocked, run once in Terminal:
#      chmod +x "start-mac.command"
# ============================================================
cd "$(dirname "$0")" || exit 1
open "index.html"
