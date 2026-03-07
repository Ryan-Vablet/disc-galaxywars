# PHASE 1 — Gameplay Depth, Audio, Multi-Select, and Juice

## Context

Phase 0 is complete. The game runs, the architecture is modular, and visual/functional parity with the monolith is ~0.9:1. The codebase is Vite + vanilla TypeScript + Canvas with a clean engine/renderer/input/UI separation.

**Your job in Phase 1**: Make this feel like a real game people would actually want to play again. Phase 0 was "it works." Phase 1 is "it's good."

**Ground rules**:
- Do NOT break existing gameplay. After every major feature, verify the base game still plays correctly.
- Do NOT introduce React, Phaser, or any UI framework. This is vanilla TS + Canvas + DOM overlays.
- Do NOT restructure the existing architecture. Add to it, don't reorganize it.
- Every new module follows the same patterns established in Phase 0: typed, tested, separated.
- Run `npm run build` after each feature to catch type errors immediately.

---

## Feature 1: Difficulty Selection

### What to build

Add a difficulty selector to the menu screen. The AI personality system already exists (`src/engine/ai/BotAI.ts` and `src/constants/ai.ts`) but there's currently no way for the player to choose difficulty. Surface this to the user.

### Implementation details

**Menu screen changes** (`src/App.ts` or wherever the menu DOM overlay lives):

Add three difficulty buttons below the existing PLAY button, or replace it with three buttons:

```
[  EASY  ]   [  NORMAL  ]   [  HARD  ]
```

Style them consistently with the existing cyber aesthetic. Each button starts the game with the corresponding AI personality:
- **EASY** → `passive` personality (slower decisions, cautious, over-commits before attacking)
- **NORMAL** → `balanced` personality (current default behavior)
- **HARD** → `aggressive` personality (fast decisions, relentless pressure, efficient attacks)

The selected difficulty should be stored in the Zustand vanilla store (`useGameStore`). When `GameCanvas` initializes the engine, it reads the difficulty from the store and passes the corresponding `AIPersonality` to the `BotAI` constructor.

**Visual treatment**: The currently-hovered difficulty button should glow slightly. Use the existing accent color (`#00e5ff`) for the selected/active button border. The other two should have the muted border style already used on buttons.

**Help screen update**: Add a brief note about difficulty to the help screen content. Something like: "Choose your challenge — Easy for learning, Normal for a fair fight, Hard for ruthless AI."

### Acceptance criteria
- [ ] Three difficulty buttons visible on menu screen
- [ ] Each starts the game with the correct AI personality
- [ ] Difficulty choice persists if you return to menu and play again
- [ ] Visual hover/active states on buttons
- [ ] Help screen mentions difficulty
- [ ] Build passes, no regressions

---

## Feature 2: Multi-Planet Selection

This is the single biggest gameplay improvement. Currently the player can only send fleets from one planet at a time. In every good Galcon-like, you can select multiple planets and launch a coordinated attack from all of them simultaneously.

### Interaction design

**Selection model — additive click:**

1. **Click an owned planet** → Select it (deselect all others). This is the current behavior and must remain the default.
2. **Shift+Click (desktop) or two-finger tap (mobile) on another owned planet** → Add it to the selection. The planet joins the currently selected set.
3. **Click an owned planet that's already selected** → Deselect it from the set.
4. **Drag from any selected planet to a target** → All selected planets send fleets to that target simultaneously.
5. **Click empty space** → Deselect all.
6. **Click an enemy or neutral planet (without drag)** → Deselect all (it's not a valid selection).

**Alternative simpler model if the above feels too complex to implement cleanly**: Box/lasso select. Click and drag on empty space to draw a selection rectangle. All owned planets inside the rectangle become selected. Then click a target planet to send from all selected. This is arguably more intuitive but requires more rendering work.

**Choose whichever model you can implement more cleanly.** The additive click model is preferred if you can nail the interaction.

### Implementation details

**InputManager changes** (`src/input/InputManager.ts`):

The input manager currently tracks a single `selection: PlanetId | null`. Change this to `selection: Set<PlanetId>`. Update the drag-start logic so that dragging begins from any planet in the selection set.

The `getDragState()` method should return drag lines from ALL selected planets to the cursor, not just one. The renderer will need to draw multiple lines.

**InputMapper changes** (`src/input/InputMapper.ts`):

Detect Shift key state on mousedown/mouseup. Expose it as a boolean on the normalized input event.

For mobile multi-select, consider a "select mode" toggle button rendered on the canvas HUD or as a small DOM button. When toggled on, any planet tap adds to selection instead of replacing it. Alternatively, simply use a long-press gesture (hold for 300ms on a planet = add to selection).

**SelectionLayer changes** (`src/renderer/layers/SelectionLayer.ts`):

Draw the animated dash line from EVERY selected planet to the cursor position during a drag. Each line uses the player color. Also draw the selection ring around every selected planet, not just one.

Add a subtle visual distinction for multi-selected planets: slightly thicker ring, or a pulsing glow, so it's clear which planets are in the active selection.

**FleetDispatcher changes** (`src/engine/actions/FleetDispatcher.ts` or `GameEngine.ts`):

Add a method to dispatch fleets from multiple sources:

```typescript
dispatchMultiFleet(fromIds: PlanetId[], toId: PlanetId, owner: PlayerId): FleetDispatchResult[]
```

This simply iterates over `fromIds` and calls `dispatchFleet` for each. The method is a convenience — the individual dispatch logic doesn't change.

**Engine event**: Emit a `fleet_launched` event for each fleet, as currently. No new event type needed.

### Acceptance criteria
- [ ] Player can select multiple owned planets
- [ ] Drag from multi-selection sends fleets from all selected planets to target
- [ ] Visual feedback: all selected planets show selection ring
- [ ] Visual feedback: drag lines drawn from all selected planets during drag
- [ ] Single-click still works as before (selects one, deselects others)
- [ ] Shift+click (or chosen modifier) adds/removes from selection
- [ ] Clicking empty space clears selection
- [ ] Mobile has some way to multi-select (toggle button, long-press, or equivalent)
- [ ] Build passes, no regressions

---

## Feature 3: Procedural Audio System (Web Audio API)

No audio files needed. Generate all sounds procedurally using the Web Audio API. This keeps the bundle size zero for audio while adding significant game feel.

### Architecture

Create the following files:

**`src/audio/AudioManager.ts`**

```typescript
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  /** Lazily initializes AudioContext on first user interaction (browser requirement). */
  init(): void;

  /** Play a sound effect. */
  play(effect: SoundEffect, options?: SoundOptions): void;

  /** Set master volume (0 to 1). */
  setVolume(volume: number): void;

  /** Mute/unmute toggle. */
  toggleMute(): void;

  /** Cleanup. */
  destroy(): void;
}
```

**`src/audio/SoundEffects.ts`**

Define the sound effect types and their synthesis parameters:

```typescript
const SOUND_EFFECTS = {
  fleetLaunch: 'fleetLaunch',
  fleetArriveReinforce: 'fleetArriveReinforce',
  fleetArriveCombat: 'fleetArriveCombat',
  planetCaptured: 'planetCaptured',
  planetLost: 'planetLost',
  victory: 'victory',
  defeat: 'defeat',
  uiClick: 'uiClick',
  uiHover: 'uiHover',
  selectPlanet: 'selectPlanet',
} as const;
```

**`src/audio/synthesizers.ts`**

Each sound effect is a function that creates and connects Web Audio nodes for a one-shot sound:

- **fleetLaunch**: Short rising chirp. OscillatorNode with frequency sweep from 200Hz → 800Hz over 100ms. Triangle wave. Low volume. Sounds like a "pew."
- **fleetArriveReinforce**: Soft, pleasant chime. Sine wave at 600Hz, quick decay (150ms), very subtle. Positive feedback — your reinforcements arrived.
- **fleetArriveCombat**: Short impact thud. White noise burst (50ms) through a low-pass filter at 300Hz. Sounds like a dull hit.
- **planetCaptured**: Ascending two-tone. First tone 400Hz for 80ms, second tone 600Hz for 120ms. Sine wave. Gap of 30ms between. Satisfying "level up" feel.
- **planetLost**: Descending two-tone. Opposite of captured — 500Hz → 300Hz. Conveys loss.
- **victory**: Three ascending tones: 400Hz → 500Hz → 700Hz, each 100ms with 50ms gaps. Major key feel.
- **defeat**: Three descending tones: 500Hz → 400Hz → 250Hz, each 120ms. Minor/sad feel.
- **uiClick**: Extremely short (30ms) click. Square wave at 1000Hz with instant decay.
- **uiHover**: Even shorter (20ms), quieter version of click at 1200Hz.
- **selectPlanet**: Soft blip. Sine 500Hz, 60ms, low volume.

### Wiring to game events

In `GameCanvas.ts` (or wherever the engine event listener is wired):

```typescript
engine.on('fleet_launched', () => audioManager.play('fleetLaunch'));
engine.on('fleet_arrived', (event) => {
  if (event.result.captured) {
    if (event.fleet.owner === localPlayerId) {
      audioManager.play('planetCaptured');
    } else {
      audioManager.play('planetLost');
    }
  } else if (event.fleet.owner === event.target.owner) {
    audioManager.play('fleetArriveReinforce');
  } else {
    audioManager.play('fleetArriveCombat');
  }
});
engine.on('game_over', (event) => {
  if (event.winner === localPlayerId) {
    audioManager.play('victory');
  } else {
    audioManager.play('defeat');
  }
});
```

Wire UI sounds to button hovers and clicks in the DOM overlay code.

### Important: AudioContext initialization

Browsers require a user gesture before creating an AudioContext. The AudioManager must lazily initialize on the first click/tap. The `init()` method should be called from the first user interaction handler (e.g., clicking PLAY on the menu). Calling `play()` before `init()` should silently no-op, not throw.

### Mute button

Add a small mute/unmute toggle icon to the in-game HUD area (top-right corner, as a DOM element overlaying the canvas). Use a simple unicode speaker icon: 🔊 / 🔇 or just a styled text toggle "[SFX ON]" / "[SFX OFF]" in the monospace style.

Persist the mute state in the Zustand store so it survives screen transitions.

### Volume considerations

All game sounds should be quiet and ambient. This is background texture, not foreground noise. Master volume default should be ~0.3. Individual effect volumes should be tuned so that:
- Fleet launch is the quietest (it fires frequently)
- Planet captured/lost is the loudest (it's the most important event)
- UI sounds are subtle clicks, barely audible

### Acceptance criteria
- [ ] AudioManager initializes lazily on first user interaction
- [ ] All sound effects listed above are implemented and trigger correctly
- [ ] Sounds are procedurally generated (no audio file imports)
- [ ] Mute toggle visible during gameplay
- [ ] Mute state persists across screen transitions
- [ ] No errors when sounds fire rapidly (e.g., multiple fleets arriving same frame)
- [ ] Volume levels are balanced — nothing is jarring or too loud
- [ ] Build passes, no regressions

---

## Feature 4: Visual Juice Pass

This feature is a collection of small visual improvements that make the game feel more polished. Each is independent.

### 4A: Attack vs. Reinforce fleet visual distinction

Currently all fleets look the same. Add a visual cue so the player can quickly tell:
- **Reinforcement fleet** (going to own planet): Standard appearance, maybe slightly dimmer trail.
- **Attack fleet** (going to enemy/neutral planet): Brighter, slightly larger glow. Add a small "pointed" shape to the fleet dot — draw a tiny triangle/arrow pointing in the travel direction instead of just a circle. This communicates aggression.

Implementation: In `FleetLayer.ts`, check if `fleet.owner === targetPlanet.owner` to determine fleet intent. Draw accordingly.

### 4B: Ownership transfer animation

When a planet is captured, the border ring color should transition smoothly from the old owner's color to the new owner's color over ~300ms instead of snapping instantly. 

Implementation: In `PlanetLayer.ts`, track a `colorTransition` timer per planet in the visual state. When a `planet_captured` event fires, set the timer and lerp the border color from old → new over the duration.

### 4C: Planet unit growth tick visual

When a planet produces units, add a very subtle "pulse" or "glow flash" effect — just a momentary brightness increase on the production ring. This gives visual feedback that planets are actively producing.

Implementation: In the renderer's visual state per planet, add a `productionFlash` value that triggers every N frames (matching production tick) and decays quickly. The production ring arc opacity gets a small boost when the flash is active.

### 4D: Fleet arrival anticipation

When an enemy fleet is heading toward one of your planets, add a subtle red-tinted pulsing ring around the threatened planet. This gives the player early warning without them having to track every fleet visually.

Implementation: In `PlanetLayer.ts`, check if any hostile fleets are targeting this planet (iterate fleets in game state). If so, draw a faint pulsing threat ring outside the normal planet ring. Use the enemy color with low alpha.

### 4E: Smooth camera/viewport (subtle)

Add a very subtle "breathing" effect to the background — the starfield and nebulae drift very slowly (1-2 pixels per second in a slow sine wave). This makes the scene feel alive even when nothing is happening. Do NOT move the planets or gameplay elements — only the background decorative layers.

Implementation: In `BackgroundLayer.ts`, add a slow offset to star and nebula positions based on time. Use `Math.sin(time * 0.0005) * 2` or similar for a barely perceptible drift.

### 4F: Fleet count badges

When multiple fleets from the same player are heading to the same target and are close together (within 40px), visually merge their unit count into a single larger badge to reduce visual clutter. The fleets still move independently, but the displayed count combines them.

Implementation: In `FleetLayer.ts`, before rendering unit counts, group nearby same-owner same-target fleets. Render one combined count badge at the centroid of the group. Still render each fleet's glow dot individually.

### Acceptance criteria
- [ ] Attack fleets look visually distinct from reinforcement fleets
- [ ] Planet capture shows smooth color transition on border ring
- [ ] Production ticks create subtle visual feedback on planet
- [ ] Incoming threat indicator visible on endangered player planets
- [ ] Background has subtle drift animation
- [ ] Nearby same-target fleets show merged unit count
- [ ] None of these cause performance degradation (profile if unsure — all particles and effects must stay within existing limits)
- [ ] Build passes, no regressions

---

## Feature 5: Post-Game Stats Screen

After victory or defeat, show the player a brief stats summary before the play-again buttons.

### Stats to track

Create a `GameStats` tracker in `src/engine/GameStats.ts`:

```typescript
interface GameStats {
  gameDuration: number;            // seconds
  fleetsLaunched: number;          // total fleets sent by player
  fleetsSent: number;              // same (for display)
  unitsProduced: number;           // total units produced by player planets
  unitsLost: number;               // total player units that died in combat
  unitsKilled: number;             // total enemy units the player killed
  planetsCaptured: number;         // times player captured a planet
  planetsLost: number;             // times player lost a planet
  peakPlanets: number;             // max planets owned at any point
  peakUnits: number;               // max total units at any point
}
```

Wire this into the engine's event system. Each relevant event increments the appropriate counter. The engine exposes `getStats(): Readonly<GameStats>`.

Track stats for both the player and the AI, but only display the player's stats on the end screen (with a comparison column for the AI's stats for context).

### Display

On the victory/defeat overlay, add a stats section between the title and the buttons. Render it as a DOM table or styled div grid. Keep the monospace font. Use the cyber aesthetic — dim text for labels, bright accent color for values.

Example layout:

```
─── BATTLE REPORT ───

Duration          2:34
Fleets Launched     18        Bot: 22
Units Produced     347        Bot: 289
Units Destroyed    203        Bot: 156
Planets Captured     6        Bot: 3
Peak Control      9/14        Bot: 7/14
```

Use a typewriter/reveal animation: stats appear one row at a time with a 150ms delay between each. This adds drama to the postgame. Each row fades/slides in from the left.

### Acceptance criteria
- [ ] GameStats module tracks all listed stats via engine events
- [ ] Stats display on both victory and defeat screens
- [ ] Shows player stats with bot comparison
- [ ] Typewriter reveal animation (rows appear sequentially)
- [ ] Duration formatted as M:SS
- [ ] Stats are accurate (spot-check: fleets launched matches number of drag-release actions)
- [ ] Build passes, no regressions

---

## Feature 6: Quality-of-Life Additions

### 6A: Keyboard shortcuts

Add keyboard bindings for common actions:

- **Escape**: Deselect all planets / close help screen / return to menu from end screens
- **Space**: Pause/unpause the game (freeze engine ticks, dim the canvas slightly, show "PAUSED" text overlay)
- **M**: Toggle mute
- **H**: Toggle help screen
- **1/2/3**: Quick-select difficulty from menu screen

Implementation: Add keyboard event listeners in `InputManager` or a new `KeyboardHandler` module. Keyboard state should not interfere with text inputs (there are none currently, but guard against it).

### 6B: Pause functionality

When paused:
- Engine stops ticking (dt = 0)
- Renderer still runs (so particles gracefully slow and the scene stays rendered, just frozen)
- A subtle dark overlay (rgba(0,0,0,0.4)) appears over the canvas
- "PAUSED" text in large monospace centered on screen (rendered on canvas or as DOM overlay)
- Click or Space to resume
- AI timer does not advance while paused

Store pause state in the Zustand store. The game loop in `GameCanvas` checks pause state before calling `engine.tick()`.

### 6C: Tooltip on planet hover

When hovering over any planet for more than 500ms, show a small tooltip near the cursor with:
- Owner label ("You" / "Bot" / "Neutral")
- Current units / max units
- Production rate (units/sec, formatted to 1 decimal)

Render this as a canvas-drawn tooltip (not DOM) so it moves smoothly with the cursor. Use a dark semi-transparent background with the monospace font. Position it offset from the cursor so it doesn't obscure the planet.

Dismiss immediately when the cursor moves off the planet. Reset the 500ms timer when moving to a different planet.

### Acceptance criteria
- [ ] Escape, Space, M, H, 1/2/3 shortcuts all work as described
- [ ] Pause freezes gameplay but keeps the scene rendered
- [ ] Pause is visually obvious (overlay + text)
- [ ] Unpause resumes exactly where it left off
- [ ] Planet hover tooltip appears after 500ms delay
- [ ] Tooltip shows correct data for player, bot, and neutral planets
- [ ] Tooltip follows cursor and dismisses immediately on mouse-out
- [ ] Build passes, no regressions

---

## Testing Requirements for Phase 1

Add or extend the following tests:

### Unit tests

- `GameStats.test.ts`: Verify counters increment correctly for each event type. Verify duration tracks correctly.
- `FleetDispatcher.test.ts`: Test the new `dispatchMultiFleet` method — verify it dispatches from all valid sources and skips invalid ones (e.g., if a planet was captured between selection and dispatch).
- `AudioManager.test.ts`: Test that `play()` before `init()` doesn't throw. Test that `toggleMute()` toggles state. (Don't try to test actual audio output — just test the state management.)

### Integration tests

- Multi-select flow: Simulate Shift+click on two planets, verify both are in selection set, simulate drag-release, verify two `fleet_launched` events.
- Pause: Start engine, tick a few frames, pause, tick more frames, verify state didn't advance during pause.

### Run all existing tests

Verify nothing in the Phase 0 test suite broke. Run:

```bash
npm test
```

All tests must pass before Phase 1 is considered complete.

---

## Build and Type Check

Run after completing ALL features:

```bash
npx tsc --noEmit     # Type check only
npm run build         # Full production build
npm test              # All tests
```

All three must pass cleanly. Fix any type errors or test failures before submitting.

---

## Summary Checklist

After Phase 1, the game should have:

- [ ] Difficulty selection (Easy / Normal / Hard) on menu
- [ ] Multi-planet selection with coordinated fleet dispatch
- [ ] Procedural audio for all game events + mute toggle
- [ ] Visual juice: attack/reinforce distinction, capture transition, production flash, threat indicators, background drift, fleet count merging
- [ ] Post-game stats with typewriter reveal
- [ ] Pause functionality (Space key)
- [ ] Keyboard shortcuts (Esc, Space, M, H, 1/2/3)
- [ ] Planet hover tooltips
- [ ] New tests for all new modules
- [ ] All existing tests still passing
- [ ] Clean build with no type errors

When complete, create `prompts/PHASE_1_SUMMARY.md` with the same format as the Phase 0 summary — what was built, what was tested, any issues encountered, and any deviations from this spec.
