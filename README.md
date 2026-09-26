# BERĔSHITH — In The Beginning

A complete journey through the book of Genesis (BERĔSHITH), with the witness of
YASHAR (Jasher) and YOḆELIM (Jubilees) — built as a self-contained HTML5
pixel-art adventure. No build step, no dependencies, no server required.

## How to play

The fastest way is to open **`index.html`** in any modern browser (desktop or
mobile). For a one-click, fully **offline** experience on a local device, use
the launchers below — see **`START HERE.txt`** for the friendly version:

| Platform | Double-click | What it does |
|---|---|---|
| Windows | `start-windows.bat` | Opens the game in your default browser (offline, no install) |
| Windows | `Create Desktop Shortcut.bat` | Run once to put a **Scripture Game** launcher on your desktop |
| macOS | `start-mac.command` | Opens the game in your default browser (offline) |
| Linux | `start-linux.sh` | Opens the game in your default browser (offline) |

No internet, account, server or build step is required — the launchers simply
open the self-contained HTML on your device.

**Desktop launchers (`Launchers/`):** run the installer for your OS once to put a
**Scripture Game** icon on your desktop — Windows/macOS/Linux supported. See
`Launchers/README.txt`.

**Fully offline network play (`fully offline network/`):** let several devices play
from one machine with **no internet**. Run `host-windows.bat` / `host-mac.command`
/ `host-linux.sh` on the host; it prints an address like `http://192.168.1.42:8080/index.html`
that any device on the same Wi-Fi/router can open. See that folder's `README.txt`.
Not needed for normal solo play.

Each game is a single HTML file and works offline; the shared scripts beside it,
`cinema.js` (the staged cutscenes), `gfx.js` (the world's ground, trees, rocks, water, animals and light),
`play.js` (the fights, the struggles, the dodge and controllers) and `voice.js` with `pron.js` (the
spoken voices, see [Voices](#voices)), add to every game and should be kept in the same folder, with
the `voices/` folder of recordings:

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

| Action | Keyboard | Touch | Controller |
|---|---|---|---|
| Move | WASD / Arrow keys | virtual joystick | left stick / d-pad |
| Interact / advance text / strike | E, Space or Enter | ✦ button, or tap | A / Start |
| Dodge (in a fight or a flight) | Shift, Q or X | ⤳ button | X or RB |
| Previous slide | Backspace / ← | on-screen button | — |
| Skip a chapter's opening verses (chapters already finished) | — | Skip ⟩⟩ button | — |
| Chapter menu | Esc / ☰ | ☰ button | B |
| Story log (every line so far) | 📜 | 📜 button | — |
| Fullscreen / sound | ⛶ / ♪ | ⛶ / ♪ | — |
| Voices on / off | V / 🗣 | 🗣 button | — |
| Read a reading book aloud (Tehillim, Mishlĕ…) | V / 🔊, or tap a verse | 🔊 button, or tap a verse | — |

Any Bluetooth or USB gamepad paired to your computer works in every game — the
browser picks it up automatically through the standard Gamepad API, so there's
nothing to install or configure. Pair it in your OS, then press a button in the
game to connect. It rumbles when you are struck.

## Mechanics

Beyond walking and talking, scenes use mechanics fitted to their stories:

- **Struggle** — press repeatedly to hold on (or hold the button down): wrestling
  the Man at Peni'al until daybreak, digging the wells of Gerar, standing the
  penance in the sea, staying up the hands of Mosheh against Amaleq.
- **Battle** — fight groups of foes: Aḇram's night rescue of Lot, Shim'on and
  Lĕwi at Sheḵem, the Amorite kings, Benayah and the lion, and more. You have
  five hearts; strike with ✦ / E (a blow swings at the foes before you, and a
  third blow in a row throws a foe back) and dodge with ⤳ / Shift. Foes circle,
  guard against idle blows, and gather themselves before they strike — a red
  warning — so step aside and strike as they recover. If your strength fails
  you rise and fight on, and the foes grow slower; the fight is always won.
- **The wars of Yasharal** — the great battles (Yeriḥo, Giḇ‛on, Miḵmash,
  Gilboa…) are fought on their own field: spur the host with a tap or Space,
  and give the orders — Charge (1), Arrows (2), Shields (3) — each ready again
  after a time. The outcome is the scripture's own.
- **Chase** — flee a pursuer: Potiphar's wife to the door, the serpent to the
  cave, a giant on Mount Ḥermon. The dodge carries you clear; if the pursuer
  reaches you it throws you forward and must gather itself again.
- **Collect / build / lead** — gather pitch for the ark, idols for the
  terebinth, lead the animals two by two, ride camels, lead the bull to the
  altar and the Azazel goat into the wilderness, build the sukkah, and more.
- **Water** — rivers, lakes and the sea can be entered: at the edge the water
  comes to the waist, further out to the neck, and in the deep you swim, more
  slowly than you walk. Where the story itself is the crossing — the Sea of Reeds
  before it parts, the Yarděn before the ark stands in it, the fords at Shibboleth
  — the deep stays closed and only the shallows can be waded.
- **Discern / choose** — judge the creatures clean or unclean by their signs,
  examine the leper as the kohen, cast the lots of Yom haKippurim, and hear
  the blessing and the curse of the covenant.

## Source texts

Game text follows The Besorah (Natsarim translation), condensed for play, with
cross-witnesses cited on-screen from YASHAR, YOḆELIM, ḤANOḴ, and the First and
Second Books of Aḏam & Ḥawwah. Reference PDFs are kept in the repository root.

The in-game reader, `besorah-offline.html`, is the text the games follow word for
word: a slide that cites a verse quotes that verse as the reader prints it,
shortened only by leaving words out (marked “…”), never by rewording. The Name
is shown as YAHUAH. Every scripture reference in every game links to its passage
in the reader. This holds for all the games: dialogue that quotes a verse uses
the reader's wording and terms (berith, mizbe’ach, qadash (Set Apart), ruach,
mal’ak, chen, shalom…), and ḤANOḴ references use the reader's own chapter
numbering rather than 1 Enoch's. Chapter titles, objectives, item descriptions
and book blurbs use the same terms, and "lord" as a title is written "master",
as the reader writes it. Two things differ on purpose: the games keep their own
spelling of names (Aḏam, Baḇel, Kasdim, Yerushalayim…), and where the reader
has an obvious misprint (e.g. "an mizbe’ach") the games print the correct word.

## Cutscenes

Every cutscene is staged: the passage it quotes is acted out on a painted set —
the palace, the House of YAHUAH, the wilderness camp, Mitsrayim, Baḇel, Shushan,
the parted sea — by the book's own characters, who walk in, kneel, bow, speak,
fight and leave in time with the verse, with crowds, props, weather and effects
(fire from heaven, the pillar of cloud, rain, glory). The verse is shown beneath
as a caption that comes up part by part; a tap shows the rest of it, the next tap
moves on. YAHUAH is never drawn as a person — only as light, cloud and fire. The
mal'akim are drawn as men, brown and dark-haired like everyone else in the games, with
no wings. Crowds that go through the sea or the Yarděn are seen from behind as they walk
into it. Everyone keeps to the ground the set gives them: no one stands on the walls of
the parted sea or on open water (those swept away are drawn in it), and the pillar of
fire and of cloud stands far off in the scene rather than under anyone's feet. The
beasts are drawn in profile from their own proportions — horses, donkeys, camels, oxen,
sheep, goats, rams, lions, leopards, bears, dogs — with jointed legs, hooves or paws,
manes, horns, humps and wool; Behemoth is a great mammoth and Liwyathan a long-necked
serpent of the sea, in the cutscenes and in the world alike. The
stage for each slide is written in the slide's `stage` field and drawn by
`cinema.js`; a slide without one (or a copy of a game without the file) shows its
own painting as before.

## Voices

Everyone who speaks is heard, each in a natural voice of their own, and every verse of
every telling is read aloud:

- **The narrator** reads the verses, in one warm, deep voice that is his alone.
- **The people** of the stories each have a voice that stays theirs in every book and at
  every age: Aḇram is Aḇraham, and Dawiḏ sounds the same as a shepherd and as sovereign. Women,
  elders, children, mal'akim, the serpent, the giants and the crowds are each given a voice
  of their kind, and those who talk to one another never share one.
- **YAHUAH** speaks in a voice given to no one else: the deepest of the voices, slow and low.
- In a verse, the narrator reads the telling and the words inside its quotation marks are
  spoken by the one the verse says spoke them ("And Mosheh said to YAHUAH", "the Mal’ak of
  YAHUAH said", "“I have loved you,” said YAHUAH"). The verse's parts on screen wait for the
  voice, so what is seen keeps pace with what is heard; a tap still moves on.
- The reading books (Tehillim, Mishlĕ, Qoheleth, Shir haShirim, Ĕḵah, Baruḵ) have a 🔊 button
  that reads the chapter aloud, verse by verse, and goes on into the next.
- On the field of battle the commander cries each order aloud, and the ending is read.

The voices are recordings in `voices/` (Opus audio, one small bank script per book listing
them), made with [Kokoro](https://github.com/hexgrad/kokoro), an open, Apache-licensed
speech model, so they sound the same on every device and need no internet. Names are
pronounced with the Besorah reader's own lexicon (`pron.js`). A line that has no recording
(one put together while the game runs) is spoken with the device's own voices instead, as
the Besorah reader does. `tools/voices/` rebuilds the recordings when the text changes:
`extract.js` lists every line with its speaker, `build.py` casts and records them (see the
notes at the top of each).

## Assets

All art, music and sound effects are generated procedurally in code — the only
recorded assets are the voices (see [Voices](#voices)). The calm background music is real **Mozart**: public-domain
themes (the Andante of K.155, the Adagios of K.458, K.80 and K.156, the
"Ah! vous dirai-je, maman" theme K.265, and the Sonata facile K.545) are
embedded as note data (`Sound.MZPIECES`) and synthesised very softly, like a
music box, over a quiet ambient pad — peaceful on purpose, and still fully
offline. Only dramatic storm/tense scenes use the small generative sequencer
(`Sound.MUSIC` in `index.html`), now heavily softened and much quieter.
Custom art can be added under `assets/` and wired into the
prop/character renderers.
