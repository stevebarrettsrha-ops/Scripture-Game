#!/bin/bash
# ============================================================
#  Scripture Game - BERESHITH
#  Puts a "Scripture Game" launcher on your Linux desktop and
#  in your applications menu. Run this once:
#      chmod +x "Install Desktop Launcher - Linux.sh"
#      ./"Install Desktop Launcher - Linux.sh"
# ============================================================
GAMEDIR="$(cd "$(dirname "$0")/.." && pwd)" || exit 1
DESKTOP="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
APPS="$HOME/.local/share/applications"
mkdir -p "$DESKTOP" "$APPS"

LAUNCHER="$DESKTOP/Scripture-Game.desktop"
cat > "$LAUNCHER" <<EOF
[Desktop Entry]
Type=Application
Name=Scripture Game
Comment=BERESHITH - play offline in your browser
Exec=xdg-open "$GAMEDIR/index.html"
Terminal=false
Categories=Game;Education;
EOF

chmod +x "$LAUNCHER"
cp -f "$LAUNCHER" "$APPS/Scripture-Game.desktop" 2>/dev/null
# Mark the desktop file as trusted (GNOME) so it launches on double-click
gio set "$LAUNCHER" metadata::trusted true 2>/dev/null

echo ""
echo "  Done! A 'Scripture Game' launcher is on your desktop and in"
echo "  your applications menu. It opens the game offline in your browser."
echo ""
