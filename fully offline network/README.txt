==============================================================
  SCRIPTURE GAME  -  Fully Offline Network Play
==============================================================

WHAT THIS IS
You do NOT need the internet to let several devices play. If
they are all joined to the same Wi-Fi router (or even a phone's
hotspot with mobile data turned OFF), one computer can "host"
the game and everyone else opens it in their browser.

HOW TO USE
1. On the HOST computer, run the script for its system:

      Windows ...  host-windows.bat
      macOS .....  host-mac.command
      Linux .....  host-linux.sh

   It needs Python (or Node.js) installed. Most Macs and Linux
   PCs already have Python. On Windows, get it free from
   https://www.python.org/downloads/ if needed.

2. The window will print one or more web addresses, for example:

      http://192.168.1.42:8080/index.html

3. On every other device (phone, tablet, laptop) connected to
   the SAME Wi-Fi / router, open that address in a browser.
   That's it - everyone is playing, no internet required.

4. Keep the host window open while people play. Closing it (or
   Ctrl+C) stops hosting.

NOTES
- Each device keeps its OWN save (progress is stored in that
  device's browser).
- If a phone can't connect, make sure it is on the same Wi-Fi
  and that the host PC's firewall allows the connection (allow
  Python/Node on "Private networks" when Windows asks).
- For normal solo play you do NOT need any of this - just use
  the launchers in the main folder. The game is fully offline
  on its own.
==============================================================
