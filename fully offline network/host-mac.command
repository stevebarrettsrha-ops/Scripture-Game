#!/bin/bash
# ============================================================
#  Scripture Game - BERESHITH  (Offline Network Host - macOS)
#  Lets OTHER devices on the SAME Wi-Fi / router play from THIS
#  Mac with NO internet. Needs Python (preinstalled on most Macs).
# ============================================================
cd "$(dirname "$0")/.." || exit 1
PORT=8080

echo "============================================================"
echo "  Scripture Game - Offline Network Host"
echo "============================================================"
echo
echo "  On other devices joined to the same Wi-Fi / router, open:"
echo
for ip in $(ipconfig getifaddr en0 2>/dev/null) $(ipconfig getifaddr en1 2>/dev/null); do
  [ -n "$ip" ] && echo "        http://$ip:$PORT/index.html"
done
echo
echo "  Keep this window open while others play. Press Ctrl+C to stop."
echo "============================================================"
echo

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT" --bind 0.0.0.0
elif command -v node >/dev/null 2>&1; then
  npx --yes http-server -p "$PORT" -a 0.0.0.0 -c-1
else
  echo "  No Python or Node.js found - cannot host."
  echo "  (You can still play solo with start-mac.command - no host needed.)"
fi
