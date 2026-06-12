# BERĔSHITH — In The Beginning

A complete journey through the book of Genesis (BERĔSHITH), with the witness of
YASHAR (Jasher) and YOḆELIM (Jubilees) — built as a self-contained HTML5
pixel-art adventure. No build step, no dependencies, no server required.

## How to play

Open **`index.html`** in any modern browser (desktop or mobile).
Each game is a single file and works offline:

| File | Game | Unlocked by |
|---|---|---|
| `index.html` | **BERĔSHITH — In The Beginning** (Genesis, 8 acts, 42 chapters) | always available |
| `book-of-adam-and-chavvah.html` | **The Books of Aḏam & Ḥawwah** (20 chapters) | finishing Act II of BERĔSHITH |
| `book-of-hanok.html` | **The Book of Ḥanoḵ** (15 chapters) | finishing the Books of Aḏam & Ḥawwah |
| `book-of-shemoth.html` | **SHEMOTH — These Are The Names** (Exodus, 8 acts, 37 chapters) | finishing BERĔSHITH |
| `book-of-vayiqra.html` | **VAYIQRA — And He Called** (Leviticus, 7 acts, 18 chapters) | finishing SHEMOTH |

Progress is saved automatically in the browser (localStorage). Finishing the
Books of Aḏam & Ḥawwah also unlocks "continuity" mode in BERĔSHITH, letting you
begin at the Flood.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD / Arrow keys | virtual joystick |
| Interact / advance text | E, Space or Enter | ✦ button, or tap |
| Previous slide | Backspace / ← | on-screen button |
| Chapter menu | Esc / ☰ | ☰ button |
| Story log (every line so far) | 📜 | 📜 button |
| Fullscreen / sound | ⛶ / ♪ | ⛶ / ♪ |

## Mechanics

Beyond walking and talking, scenes use mechanics fitted to their stories:

- **Struggle** — press repeatedly to hold on: wrestling the Man at Peni'al
  until daybreak, digging the wells of Gerar, standing the penance in the sea,
  staying up the hands of Mosheh against Amaleq.
- **Battle** — fight groups of foes: Aḇram's night rescue of Lot, Shim'on and
  Lĕwi at Sheḵem, the Amorite kings, the serpents of Kush, the shepherds of
  Miḏyan, and the war with Amaleq.
- **Chase** — flee a pursuer: Potiphar's wife to the door, the serpent to the
  cave, a giant on Mount Ḥermon, Pharaoh's chariots at the Sea of Reeds.
- **Collect / build / lead** — gather pitch for the ark, idols for the
  terebinth, lead the animals two by two, ride camels, lead the bull to the
  altar and the Azazel goat into the wilderness, build the sukkah, and more.
- **Discern / choose** — judge the creatures clean or unclean by their signs,
  examine the leper as the kohen, cast the lots of Yom haKippurim, and hear
  the blessing and the curse of the covenant.

## Source texts

Game text follows The Besorah (Natsarim translation), condensed for play, with
cross-witnesses cited on-screen from YASHAR, YOḆELIM, ḤANOḴ, and the First and
Second Books of Aḏam & Ḥawwah. Reference PDFs are kept in the repository root.

## Assets

All art, music and sound are generated procedurally in code — there are no
binary game assets. Custom art can be added under `assets/` and wired into the
prop/character renderers.
