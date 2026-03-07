# PHASE 1.5 Summary - Procedural Pixel Planets (WebGL -> Canvas Cache)

## Outcome

Implemented a renderer-only pixel-planet pipeline that uses raw WebGL2 shaders to pre-render planet textures and caches them for Canvas2D drawing during gameplay. Core gameplay systems (engine/AI/input/actions) were not modified.

## What Was Built

- Added a full planet rendering module under `game/client/src/planets`:
  - `WebGLShaderRenderer.ts`
  - `PlanetTextureGenerator.ts`
  - `PlanetTextureCache.ts`
  - `PlanetTypes.ts`
  - `shaders/common.glsl.ts`
  - `shaders/rivers.glsl.ts`
  - `shaders/landmasses.glsl.ts`
  - `shaders/dryterran.glsl.ts`
  - `shaders/iceworld.glsl.ts`
  - `shaders/lavaworld.glsl.ts`
  - `shaders/gasplanet.glsl.ts`
  - `shaders/noatmosphere.glsl.ts`
  - `shaders/star.glsl.ts`

- Integrated into renderer pipeline:
  - `CanvasRenderer` now initializes texture generation and injects cache into render context.
  - `PlanetLayer` now:
    - draws cached procedural textures clipped to circular planet masks
    - keeps existing rings/selection/production/unit text/capture flash
    - falls back gracefully to flat body rendering when texture missing/unavailable
    - uses texture dominant color to influence outer glow

- Avatar badge move:
  - Ownership avatar placeholder now renders above owned planets as a badge with connector line.
  - Neutral planets show no avatar badge.

## Homeworld/Type Behavior

- Deterministic planet type assignment based on planet ID + seed.
- Player homeworld forced to terran-style (`rivers`).
- Bot homeworlds forced to aggressive style (`lavaworld`).
- Color palettes vary deterministically per planet for non-identical same-type worlds.

## WebGL Fallback

- If WebGL2 is unavailable, generator cache stays empty and `PlanetLayer` uses the existing flat fallback drawing.
- Game remains fully playable with no logic changes.

## Tests Added

- `game/client/src/__tests__/planets/WebGLShaderRenderer.test.ts`
- `game/client/src/__tests__/planets/PlanetTextureCache.test.ts`
- `game/client/src/__tests__/planets/PlanetTypes.test.ts`

## Verification

- `npx tsc --noEmit` ✅
- `npm run build` (workspace root) ✅
- `npm run test` (workspace root) ✅

## Deviations / Notes

- Shader math is a clean GLSL/WebGL2 procedural implementation inspired by Deep-Fold structure rather than a verbatim one-to-one port of each Godot shader file.
- Rotation-frame pre-render animation and explicit loading UI were not added in this pass; current implementation renders one static texture per planet at init and keeps render-time performance stable.


---

## Changes Since Phase 0

*(Summary of major updates applied after the initial scaffold.)*

### Project structure

- **Monorepo**: Client and server moved under `game/` (`game/client`, `game/server`). Root `package.json` uses npm workspaces; scripts delegate to `game/client` (build, dev, test) and `game/server` (placeholder).
- **Paths**: All app code now lives under `game/client/src/`; path alias `@/` unchanged. `downloads/` and `prompts/` remain at project root.

### Deployment

- **GitHub Pages**: Script (e.g. `scripts/deploy-gh-pages.js` or npm script) builds the client and pushes the `dist/` output to the `gh-pages` branch so the site is served from the built app (no `docs/` folder). Site URL: `https://<username>.github.io/disc-galaxywars/`.

### Phase 1 (gameplay, audio, UI)

- **Difficulty / Game speed**: Menu has labeled dropdowns “Bot Difficulty” and “Game Speed”. Speeds: Slowest, Slow, Normal, Fast, Fastest (tick-rate multipliers).
- **Map size**: Option (e.g. Small / Medium / Large) drives planet count (e.g. extra planets per player + homeworlds). Map generator uses player count and map size.
- **Bots**: Replaced single “# of Bots” slider with a **Player list** (multiplayer-ready): “Players” label with count (e.g. 3 / 8), bot count 0–7 with +/- controls, default 1 bot. Start Game disabled when total players &lt; 2.
- **Player list**: Each row shows avatar (silhouette on team color), name (“Player”, “Bot 1”, …), and color swatch to cycle through 8 team colors (no duplicate colors).
- **Homeworlds**: Starting planets marked as homeworlds: crown icon above, outline; same pattern can extend to special/buff planets later.
- **Phase 1 features** (see `prompts/PHASE_1_SUMMARY.md`): Multi-select, procedural audio, visual juice, post-game stats, pause, shortcuts, tooltips.

### Phase 1.5 – Pixel planets and demo

- **Three.js PixelPlanets**: Planet rendering ported to Three.js using the PixelPlanets example’s layered fragment shaders (dust, nebula, base, land, rivers, craters, clouds, atmosphere, lakes, gas, rings, star, asteroid, dry, etc.). All planet types (e.g. noatmosphere, earth, ice, lava, gas giant, ringed gas, star, asteroid, dry) use the same composition style as the reference.
- **PlanetTextureCache / runtime**: Textures are produced by a dedicated Three.js runtime per planet (type + seed); no pulse animation on the sphere—shader animation only. Each planet is randomly varied (seed/type).
- **Demo Planet page**: Title screen has a “DEMO PLANET” button. Demo scene allows live control of planet type, seed, pixels, rotation, and shows the animated planet; pointer-events and overlay wiring fixed so controls and “Back” work.
- **Shaders**: Division-by-zero and negative-sqrt issues in shaders fixed (e.g. `max(d, 0.001)`, `max(0.0, …)` for spherify, safe dither divisors).

### Title screen layout

- **Layout**: Responsive menu with header, horizontal settings row (difficulty, speed, map size), player panel (Players count, bot +/- widget, list of player rows with avatar, name, color swatch), and actions (Start Game, How to Play, Demo Planet).
- **Background**: One large procedural planet (Three.js, random type) rendered behind the menu with a semi-transparent overlay so text stays readable; planet animates slowly.
- **Styling**: `game/client/src/ui/styles/global.css` updated for `.menuScreen`, `.playerPanel`, `.playerList`, `.playerRow`, `.colorSwatch`, responsive breakpoints.

### Starfield and stars

- **Nebula background**: PixelPlanets-style dust and nebula implemented in `StarfieldBackground.ts` (WebGL/Three.js), rendered to an offscreen canvas and drawn as the first background layer.
- **Stars**: Replaced procedural twinkling dots with **sprite-based stars** matching PixelPlanets: two PNG atlases in `game/client/public/assets/stars/` (`stars.png`, `stars-special.png`). Normal atlas 9 frames, special 6 frames; 50% special, random frame, color `#ffffff` or `#ffef9e`, opacity 0.1–1. Stars are drawn flat (no sphere rotation), random 2D positions, ~420 stars for performance.
- **Performance**: Yellow-tinted stars use a **pre-built cache** (one small canvas per atlas frame, tinted once at load). No per-frame canvas/context creation; render is drawImage + globalAlpha only. Display sizes: normal 11px, special 16px.
- **Grid**: Subtle grid and any fallback background logic unchanged; star layer draws on top of the nebula canvas.

### Constants and state

- **TEAM_COLORS**: Central palette of 8 team colors in `constants/visual.ts`; player list and game use this for avatars and ownership.
- **Store**: `useGameStore` holds `players` (PlayerSlot: id, name, colorIndex, isBot), `addBot` / `removeBot` / `cyclePlayerColor`, and derived `getBotCount()` for the engine.

### Verification

- Build: `npm run build` (from repo root or `game/client`).
- Tests: `npm test` (Vitest); existing engine, planet, and audio tests still passing.
- Linting: No new lint errors from the above changes.
