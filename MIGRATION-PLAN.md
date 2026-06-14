# Scripture Game — Migration Plan
### From the current chapter-based game to a single seamless, living, travelable world

**Target (decided):** one large *seamless top-down* world (Oracle/Minish-scale, streamed region by region), **light-hybrid** combat (story & exploration first, occasional set-piece battles), rendered entirely in the **existing art style**, with the existing books reachable as sites you walk to.

---

## Where we are today

**Current architecture**
- Several self-contained HTML files (`book-of-adam-and-chavvah.html`, `book-of-shemoth.html`, `book-of-vayiqra.html`, `book-of-bamidbar.html`, `book-of-hanok.html`, …). Each carries its **own near-duplicate copy of the engine**: `drawChar`, `drawProp`, `tileColor`, `generateMap`, `Game` loop, `Camera`, dialogue, objectives, a `battle` scaffold, and `Save`.
- Content lives in a `STORY` array → acts → chapters. `Game.startChapter(ch)` plays one; scenes are small bounded maps (~40–60 tiles) built per chapter and discarded on exit.
- Gameplay is already real-time free-roam *within* a scene (walk, camera-follow, interact) — the per-scene boundary is the only thing that makes it feel "boxed."

**What the two demos already proved**
- `world-slice-prototype.html` — the **engine can stream a big living world**: chunk load/unload around the player, persistent per-chunk population, only near-player entities awake, waypoint + minimap, a doorway, and a set-piece battle trigger — holding **60fps** with hundreds of entities. *(placeholder art, on purpose)*
- `world-travel-styled.html` — that **same big walkable world looks exactly like the game**: one large map rendered by the real `drawChar`/`drawProp`/`tileColor`/HUD, Adam + Ḥawwah free-roaming past camp, flock, river ford, and altar. *(one authored map, not yet streamed)*

**The migration is simply: fuse those two, then grow content on top — additively. No rewrite, no new engine.**

---

## Guiding principles

1. **Always runnable.** Every milestone ends in something you can open and walk around in. No multi-week "dark" refactors.
2. **Reuse the renderers.** The streaming layer sits *under* `drawChar`/`drawProp`. The art never changes.
3. **Content is portable.** The writing, chapter scripts, dialogue, and sprites carry forward at every step.
4. **Screenshot-driven QA.** Keep using the headless (Playwright) screenshot + error-check harness as the regression net for every milestone.
5. **De-risk early.** Tackle the unknowns (shared engine, streaming under real art, performance) before the high-volume content work.

---

## Milestones

> Effort is **relative** (S / M / L / XL), not a calendar promise — it depends on team size and how much new art/geography you author. Risk is the chance of surprises.

### M0 — Unify the engine *(prerequisite)*
**Goal:** one shared engine + content as data, instead of N copied engines.
**Tasks**
- Extract the common engine (palette, tiles `T`/`BIOMES`, `drawChar`, `drawProp`, `generateMap`, `Game`, `Camera`, dialogue, objectives, `Save`) into a single shared module/file.
- Move each book's `STORY` into its own data module; reconcile the small drifts between the book copies (biomes, prop variants).
- One app shell loads the engine + all books.
**Done:** every existing chapter still plays identically, from one unified codebase.
**Demo:** the current game, unchanged to the player, running from shared code.
**Effort:** L **Risk:** Medium *(reconciling drift is the work)*

### M1 — Streaming world core *(fuse the two demos)*
**Goal:** the real renderers running on a streamed, unbounded world.
**Tasks**
- Chunk system: world divided into N×N-tile chunks; generate terrain per chunk via a `worldGen(x,y)` (replacing single-map `generateMap`); activation ring; entity activation/LOD; persist chunk state.
- Camera unbounded (remove map-edge clamp). Render visible chunks with `tileColor`/`drawProp`; entities via `drawChar`.
**Done:** walk Adam across many chunks that stream in seamlessly, in the real style, at 60fps.
**Demo:** `world-slice` mechanics + `world-travel` art in one file.
**Effort:** L **Risk:** Medium-High *(real `drawProp` is heavier than placeholders — needs per-chunk decor caching + culling)*

### M2 — Authored geography (the journey map)
**Goal:** the real biblical land, not noise.
**Tasks**
- A low-res region/biome map (data grid or painted image) that `worldGen` samples: Eden, the wilderness, Sinai, the Jordan, Canaan, the sea (Yam Suph), deserts, mountains — with blended transitions.
- Place landmark anchors; carve rivers/paths; guarantee walkable routes between sites.
**Done:** walk the journey end-to-end; regions blend seamlessly; minimap reflects true geography.
**Demo:** a guided walk from "Egypt" to "Sinai" across correct terrain.
**Effort:** XL *(design-heavy — iterate via screenshots)* **Risk:** Medium

### M3 — Sites & doorways (connect the stories)
**Goal:** enter existing chapters from the open world; return with progress.
**Tasks**
- A `site` prop carrying `{chapterId}`; walk up → `startChapter`; on chapter complete → return to the world at that site, mark progress.
- Story gating: the pillar-of-cloud waypoint points to the next unlocked site.
- Chapters stay as **instances/interiors** initially (simplest), seamless-in-place later.
**Done:** from the world, walk to Sinai → play the real Shemoth chapter → return; next site unlocks.
**Demo:** one real chapter launched and completed from the open world.
**Effort:** M **Risk:** Medium

### M4 — Living world (population, AI, LOD)
**Goal:** it feels alive and stays fast everywhere.
**Tasks**
- Per-region population density; herds, crowds, travellers; reuse `wander`/`route` AI; ambient creatures.
- Entity budgets + LOD tiers (freeze/simplify distant); optional day/night.
**Done:** populated wherever you go; 60fps holds at target density.
**Demo:** a busy region (a city, a camp) at full life, perf readout green.
**Effort:** L **Risk:** Medium-High *(perf — needs pooling + LOD)*

### M5 — Traversal & systems
**Goal:** the navigation UX of a real game.
**Tasks**
- Mount/chariot fast travel (engine already has `mount` support); fast-travel to discovered sites; quest **journal**; world **map screen** + minimap.
- World **save/persistence**: visited chunks, progress, positions, inventory across the seamless world.
**Done:** smooth navigation; save/continue works across the whole world.
**Demo:** ride → fast-travel → open journal/map → quit → continue intact.
**Effort:** M **Risk:** Medium *(save-format migration)*

### M6 — Light-hybrid combat
**Goal:** event-driven set-pieces, not constant fighting.
**Tasks**
- Turn the existing `battle` scaffold into **world trigger zones** (Amalĕq, Yericho, Miḏyan); health/HUD; defeat/return handling.
**Done:** a few real set-piece battles trigger in-world and resolve cleanly.
**Demo:** walk into the Amalĕq valley → battle → outcome → world continues.
**Effort:** M **Risk:** Medium

### M7 — Content migration (port all books in)
**Goal:** the entire existing story reachable in the one world.
**Tasks**
- Place every chapter as a site in the correct geography; verify each plays + returns; stitch the narrative order/waypoints. Book by book.
**Done:** all current content playable within the seamless world.
**Demo:** the full journey navigable start to finish.
**Effort:** XL *(volume)* **Risk:** Low-Medium *(mechanical, but large)*

### M8 — Polish, performance & ship
**Goal:** shippable.
**Tasks**
- Region audio/ambience, transition polish, streaming-hitch elimination, touch/mobile, perf passes, playtest + bugfix, offline/PWA packaging (you already have `besorah-offline.html` as a pattern), release.
**Done:** a stable, performant, installable seamless game.
**Effort:** L **Risk:** Medium

---

## Phasing & dependencies

| Phase | Milestones | Outcome |
|---|---|---|
| **A — Foundation** | M0 → M1 | One engine; a streamed world in your art |
| **B — World & stories** | M2 → M3 | Real geography you walk; real chapters launchable from it |
| **C — Life & systems** | M4 → M5 → M6 | Populated, navigable, with set-piece battles |
| **D — Content & ship** | M7 → M8 | All books in-world; polished; released |

Hard dependencies: M1 needs M0; M3 needs M1; M7 needs M3+M5. M2 can begin in parallel with M1 (it's mostly design/data).

---

## Smallest shippable version (recommended first public cut)
**After M1 + M2(one region) + M3(one site) + M5(save):** ship **one seamless region** (e.g., Sinai and its surroundings) with **one real chapter** playable from it and saving. That's a genuine, releasable vertical slice — proves the whole game to players and to you, and everything after is "more regions, more sites."

---

## Cross-cutting concerns

- **Performance budget:** target 60fps with an entity-activation cap (~200–400 awake). Per-chunk decor cache; LOD tiers; pooling. Track an on-screen perf readout in dev (as the slice demo does).
- **Testing:** institutionalize the headless **screenshot + pageerror** harness — run it per milestone over key regions/sites as a regression net.
- **Art pipeline:** no new render tech required; new content = new `drawProp` cases / `CHARS` entries / region palettes in the existing style.
- **Save versioning:** version the save schema from M5 so later changes can migrate cleanly.
- **Source control:** keep `world-slice-prototype.html` and `world-travel-styled.html` as reference proofs; build M0/M1 as the new mainline.

---

## Top risks & mitigations

| Risk | Mitigation |
|---|---|
| Engine drift between book copies (M0) | Diff the copies; pick one canonical engine; reconcile prop/biome variants first |
| Real `drawProp` too heavy when streamed (M1) | Per-chunk decor caching, aggressive cull, LOD; measure early with the perf readout |
| Geography is large design work (M2) | Author a low-res region map first; iterate with screenshots; procedural fill inside regions |
| Content volume (M7) | Mechanical and parallelizable; do it book-by-book after the pattern is proven in M3 |
| Scope creep toward "open combat / 3D" | Hold the line: light-hybrid set-pieces only; 2D top-down only |

---

## One-line summary
**M0 unify → M1 fuse the demos → M2 author the land → M3 wire one story → ship a one-region slice → then scale regions, life, systems, and the rest of the books.** Every step runnable, every step in your style, nothing thrown away.
