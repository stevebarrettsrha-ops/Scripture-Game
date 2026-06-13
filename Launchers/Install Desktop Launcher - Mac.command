#!/bin/bash
# ============================================================
#  Scripture Game - BERESHITH
#  Puts a "Scripture Game" launcher on your macOS Desktop.
#  Run this once (right-click > Open the first time if blocked).
# ============================================================
GAMEDIR="$(cd "$(dirname "$0")/.." && pwd)" || exit 1
DESKTOP="$HOME/Desktop"
LAUNCHER="$DESKTOP/Scripture Game.command"

cat > "$LAUNCHER" <<EOF
#!/bin/bash
# Scripture Game launcher - opens the game offline in your browser
open "$GAMEDIR/index.html"
EOF

chmod +x "$LAUNCHER"
echo ""
echo "  Done! A 'Scripture Game' launcher is now on your Desktop."
echo "  Double-click it any time to play - offline, no internet needed."
echo ""
