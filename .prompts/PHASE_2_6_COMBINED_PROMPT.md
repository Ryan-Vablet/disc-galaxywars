# PHASE 2.6 — Telemetry, Camera Rotation, Auto-Orient, and Input Remap

## Overview

This phase delivers three interconnected changes:

**Part A — Input Remap**: Clean up the mouse input scheme so every button has exactly one job. Left click handles planets and lasso selection. Right click pans. Middle click rotates. No modifier keys needed.

**Part B — Camera Rotation with Auto-Orient**: Adds world rotation around the Sun (0,0). On game start, the camera auto-rotates so the local player's homeworld is on the left and the map fills the screen optimally. Manual rotation via middle-click drag, mouse wheel with shift as optional alternative, and a UI slider.

**Part C — Telemetry Tracking System**: A passive observer that captures balance metrics during gameplay.

**Implementation order**: A → B → C. The input remap must happen first because rotation depends on the new middle-click binding, and telemetry is independent of both.

**What does NOT change**: Engine, AI, combat, production, planet textures, audio.

---

# ═══════════════════════════════════════════════════════════════
# PART A — INPUT REMAP
# ═══════════════════════════════════════════════════════════════

## New Input Scheme

| Input | Action | Handler |
|---|---|---|
| Left click on owned planet + drag to target | Fleet send (existing) | InputManager |
| Left click on empty space + drag | Lasso selection box | InputManager |
| Left click on selected planet(s) + drag to target | Multi-fleet send | InputManager |
| Left click on empty space (no drag) | Deselect all | InputManager |
| Right click + drag | Pan camera | CameraController |
| Middle click + drag | Rotate camera | CameraController |
| Mouse wheel | Zoom at cursor | CameraController |
| Mouse wheel + Shift | Rotate (optional alternative) | CameraController |

### Key behavior details

**Left click is NEVER pan.** This is the most important change. Currently left-click-drag on empty space pans the camera. After this change, left-click-drag on empty space draws a lasso selection rectangle. Panning moves exclusively to right-click.

**Right-click context menu must be suppressed** on the canvas. Add `e.preventDefault()` on the `contextmenu` event for the canvas element.

**Lasso selection box**:
1. Left mousedown on empty space → record start position (world coordinates)
2. Mouse move → draw a selection rectangle from start to current position
3. Left mouseup → find all owned planets inside the rectangle, add them to selection
4. If no owned planets in the rectangle → deselect all (same as clicking empty space)

The selection rectangle should be rendered by `SelectionLayer` as a semi-transparent rectangle with a dashed border in the player's color.

### Files to modify

**`src/input/InputManager.ts`**:
- Remove all pan logic (it no longer lives here)
- Add lasso selection state: `lassoStart: Vec2 | null`, `lassoEnd: Vec2 | null`
- On left mousedown: if planet hit → fleet selection (existing). If empty space → start lasso.
- On left mousemove with lasso active: update `lassoEnd`
- On left mouseup with lasso active: find owned planets in rectangle, set selection, clear lasso
- Expose `getLassoState(): { start: Vec2; end: Vec2 } | null` for the renderer
- Expose `isInteracting(): boolean` — true if fleet drag OR lasso is active

**`src/input/InputMapper.ts`**:
- Map right-click events (button === 2) for pan
- Map middle-click events (button === 1) for rotation
- Suppress context menu on canvas

**`src/camera/CameraController.ts`**:
- Remove left-click pan entirely
- Right-click drag (button === 2) → pan
- Middle-click drag (button === 1) → rotate (placeholder, wired in Part B)
- Mouse wheel → zoom (unchanged)
- Mouse wheel + Shift → rotate (wired in Part B)
- No longer needs to check `inputManager.isInteracting()` for pan — right-click is always pan regardless of what the left button is doing

**`src/renderer/layers/SelectionLayer.ts`**:
- Add lasso rectangle rendering
- Read lasso state from the render context
- Draw semi-transparent filled rectangle with dashed border
- Use player color at low opacity (e.g., rgba with 0.15 fill, 0.6 border)

**`src/renderer/types.ts`**:
- Add `lassoState: { start: Vec2; end: Vec2 } | null` to RenderContext

### Lasso selection in world space

The lasso rectangle must work in world coordinates (since planets are in world space and the camera may be zoomed/panned):

```typescript
// On mousedown (empty space):
const worldPos = camera.screenToWorld(screenX, screenY);
this.lassoStart = worldPos;

// On mousemove:
const worldPos = camera.screenToWorld(screenX, screenY);
this.lassoEnd = worldPos;

// On mouseup — find planets in rectangle:
const minX = Math.min(lassoStart.x, lassoEnd.x);
const maxX = Math.max(lassoStart.x, lassoEnd.x);
const minY = Math.min(lassoStart.y, lassoEnd.y);
const maxY = Math.max(lassoStart.y, lassoEnd.y);

const selected = planets.filter(p =>
  p.owner === localPlayerId &&
  p.x >= minX && p.x <= maxX &&
  p.y >= minY && p.y <= maxY
);
```

### Mobile touch input

| Gesture | Action |
|---|---|
| One-finger tap on planet | Select |
| One-finger drag from planet | Fleet send |
| One-finger drag on empty space | Pan (since there's no right-click on mobile) |
| One-finger long-press on empty space + drag | Lasso select (after 300ms hold) |
| Two-finger pinch | Zoom |
| Two-finger rotate gesture | Rotate camera |

On mobile, one-finger drag on empty space remains pan (no change from current behavior). Lasso select on mobile uses long-press to differentiate from pan. This is a compromise — mobile doesn't have separate mouse buttons.

### Acceptance criteria for Part A
- [ ] Left click on empty space + drag draws a selection rectangle
- [ ] Releasing the rectangle selects owned planets inside it
- [ ] Left click on empty space (no drag / tiny drag) deselects all
- [ ] Right click + drag pans the camera
- [ ] Left click drag NEVER pans
- [ ] Right-click context menu suppressed on canvas
- [ ] Fleet selection still works: left click owned planet, drag to target
- [ ] Multi-select via lasso → drag from any selected planet to target → all send fleets
- [ ] Middle click + drag does nothing yet (placeholder for Part B rotation)
- [ ] Mobile: one-finger on empty still pans, two-finger pinch still zooms
- [ ] Build passes, game plays correctly

---

# ═══════════════════════════════════════════════════════════════
# PART B — CAMERA ROTATION WITH AUTO-ORIENT
# ═══════════════════════════════════════════════════════════════

## Concept

The world rotates around the Sun (world origin 0,0). The primary use case is **auto-orient**: on game start, the camera calculates the optimal rotation so the local player's homeworld is on the left side of the screen, making landscape displays feel natural. Players can also manually rotate for tactical viewing angles.

## New Files

```
src/camera/            (existing directory)
├── Camera.ts          (modify — add rotation state and math)
├── CameraController.ts (modify — add rotation input)
src/ui/components/
└── RotationControls.ts (NEW — rotation slider UI)
```

## Step 1: Camera Rotation State

### Add rotation to CameraState

```typescript
interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;  // degrees, 0-360
}
```

Initialize `rotation: 0` in both `state` and `targetState`.

### Rotation utility functions

```typescript
function normalizeAngle(degrees: number): number {
  let a = degrees % 360;
  if (a < 0) a += 360;
  return a;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Shortest rotation path between two angles (handles wrap-around). */
function shortestAngleDelta(from: number, to: number): number {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}
```

### Updated worldToScreen

Rotation is applied around the world origin (0,0) — the Sun's position:

```typescript
worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
  const rad = toRadians(this.state.rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Rotate world point around origin
  const rotX = worldX * cos - worldY * sin;
  const rotY = worldX * sin + worldY * cos;

  // Then apply camera pan and zoom
  return {
    x: (rotX - this.state.x) * this.state.zoom + this.viewportWidth / 2,
    y: (rotY - this.state.y) * this.state.zoom + this.viewportHeight / 2,
  };
}
```

### Updated screenToWorld

Inverse: undo zoom/pan, then undo rotation:

```typescript
screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  // Undo zoom and pan
  const preRotX = (screenX - this.viewportWidth / 2) / this.state.zoom + this.state.x;
  const preRotY = (screenY - this.viewportHeight / 2) / this.state.zoom + this.state.y;

  // Undo rotation (negative angle)
  const rad = toRadians(-this.state.rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: preRotX * cos - preRotY * sin,
    y: preRotX * sin + preRotY * cos,
  };
}
```

### Updated applyTransform

```typescript
applyTransform(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
  ctx.scale(this.state.zoom, this.state.zoom);
  ctx.rotate(toRadians(this.state.rotation));
  ctx.translate(-this.state.x, -this.state.y);
}
```

### Rotation methods

```typescript
rotate(deltaDegrees: number): void {
  this.targetState.rotation = normalizeAngle(this.targetState.rotation + deltaDegrees);
}

setRotation(degrees: number): void {
  const n = normalizeAngle(degrees);
  this.state.rotation = n;
  this.targetState.rotation = n;
}

getRotation(): number {
  return this.state.rotation;
}
```

### Smooth interpolation update

The `update()` method must handle rotation wrap-around (e.g., interpolating from 350° to 10° should go through 0°, not backwards through 180°):

```typescript
update(dt: number): void {
  const smoothing = 1 - Math.pow(0.001, dt); // or whatever smoothing formula is in use

  this.state.x = lerp(this.state.x, this.targetState.x, smoothing);
  this.state.y = lerp(this.state.y, this.targetState.y, smoothing);
  this.state.zoom = lerp(this.state.zoom, this.targetState.zoom, smoothing);

  // Rotation: use shortest path interpolation
  const rotDelta = shortestAngleDelta(this.state.rotation, this.targetState.rotation);
  this.state.rotation = normalizeAngle(this.state.rotation + rotDelta * smoothing);
}
```

## Step 2: Auto-Orient on Game Start

This is the key feature. When a game starts, calculate the rotation that places the local player's homeworld on the left side of the screen, then call `fitBounds` with that rotation.

### Calculate optimal rotation

```typescript
/**
 * Calculate the rotation angle that places a specific homeworld
 * on the left side of the screen (pointing toward negative X in screen space).
 * The Sun is at origin, so the homeworld's angle from the Sun determines the rotation.
 */
function calculateAutoOrientAngle(homeworld: Planet): number {
  // Angle from Sun (0,0) to homeworld
  const angleToHomeworld = Math.atan2(homeworld.y, homeworld.x) * (180 / Math.PI);

  // We want the homeworld to appear on the LEFT of the screen.
  // "Left" means the homeworld should be at 180° in screen space.
  // So we rotate by: -(angleToHomeworld - 180°) = 180° - angleToHomeworld
  const rotation = normalizeAngle(180 - angleToHomeworld);

  return rotation;
}
```

### Updated fitBounds

`fitBounds` should NOT reset rotation to 0°. Instead, it should optionally accept a target rotation:

```typescript
fitBounds(bounds: WorldBounds, padding?: number, rotation?: number): void {
  // Calculate zoom to fit bounds with padding
  const worldWidth = bounds.maxX - bounds.minX + (padding ?? 0) * 2;
  const worldHeight = bounds.maxY - bounds.minY + (padding ?? 0) * 2;
  const zoom = Math.min(
    this.viewportWidth / worldWidth,
    this.viewportHeight / worldHeight
  );

  // Center on bounds center
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  this.targetState.x = cx;
  this.targetState.y = cy;
  this.targetState.zoom = clamp(zoom, this.minZoom, this.maxZoom);

  if (rotation !== undefined) {
    this.targetState.rotation = normalizeAngle(rotation);
  }
  // If rotation not specified, keep current rotation

  // Snap instantly on game start (set state = targetState)
  this.state = { ...this.targetState };
}
```

### Game start sequence

In `GameCanvas.ts` (or wherever the game initializes):

```typescript
// After map generation:
const localPlayerHomeworld = state.planets.find(
  p => p.type === 'homeworld' && p.owner === localPlayerId
);

const autoRotation = localPlayerHomeworld
  ? calculateAutoOrientAngle(localPlayerHomeworld)
  : 0;

const worldBounds = calculateWorldBounds(state.planets);
camera.fitBounds(worldBounds, 100, autoRotation);
```

Now on a landscape screen with 2 players, if your homeworld spawned at the top (12 o'clock position), the map auto-rotates so your homeworld is on the left and the opponent is on the right. The Sun stays centered. This works for any player count and any screen orientation.

### Home key resets to auto-orient (not to 0°)

When pressing Home/F to reset the camera, it should return to the auto-oriented view, not rotation 0°:

```typescript
// Store the auto-orient angle at game start
this.autoOrientAngle = autoRotation;

// On Home key:
camera.fitBounds(worldBounds, 100, this.autoOrientAngle);
```

## Step 3: Text Counter-Rotation

**CRITICAL**: When the world is rotated, all text and UI-like elements drawn on the canvas become rotated too. Unit counts, fleet labels, avatar badges, and tooltips will be upside down at 180° rotation. These must be counter-rotated so they always read left-to-right.

### Implementation pattern

For every text draw or UI element drawn in world space, apply counter-rotation at the draw site:

```typescript
// Helper function
function drawWorldText(
  ctx: CanvasRenderingContext2D,
  text: string,
  worldX: number,
  worldY: number,
  rotation: number,  // current camera rotation in degrees
  font: string,
  fillStyle: string,
  textAlign: CanvasTextAlign = 'center',
  textBaseline: CanvasTextBaseline = 'middle'
): void {
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.rotate(toRadians(-rotation));  // counter-rotate
  ctx.font = font;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
```

### Where to apply counter-rotation

| Element | File | What to counter-rotate |
|---|---|---|
| Planet unit counts | PlanetLayer.ts | The number below each planet |
| Planet name/type labels | PlanetLayer.ts | If showing planet type text |
| Avatar badges | PlanetLayer.ts | The avatar circle + icon above the planet |
| Fleet unit counts | FleetLayer.ts | The number above each fleet |
| Tooltip | Wherever tooltips render | The entire tooltip box |
| Selection layer text | SelectionLayer.ts | Any text annotations |

**Avatar badges are special**: The entire badge (circle + silhouette + connection line) should be counter-rotated as a group so the badge always appears "above" the planet visually, not rotated to some arbitrary angle:

```typescript
// In PlanetLayer, for avatar badge:
ctx.save();
ctx.translate(planet.x, planet.y);
ctx.rotate(toRadians(-cameraRotation));  // counter-rotate entire badge group
// Now draw badge at (0, -planet.r - avatarRadius - 8) relative to planet
// This always places it "above" regardless of world rotation
ctx.restore();
```

### Elements that SHOULD rotate (do NOT counter-rotate)

- Planet bodies and textures (they're part of the world)
- Fleet glow and trail particles (they follow world-space trajectories)
- Selection rings around planets
- Glow effects
- The grid

## Step 4: Parallax Rotation

The background parallax layers need rotation too, at their reduced rates:

```typescript
// In BackgroundLayer.ts:
const PARALLAX_ROTATION = {
  nebula: 0.02,   // barely rotates
  stars: 0.05,    // subtle
  grid: 0.3,      // noticeable but slower than world
};

// For each layer:
const layerRotation = cameraState.rotation * PARALLAX_ROTATION.stars;

ctx.save();
ctx.translate(vw / 2, vh / 2);
ctx.scale(starZoom, starZoom);
ctx.rotate(toRadians(layerRotation));  // parallax rotation
ctx.translate(-vw / 2 + starOffsetX, -vh / 2 + starOffsetY);
this.drawStars(ctx, context);
ctx.restore();
```

## Step 5: CameraController — Rotation Input

### Middle-click drag → rotate

```typescript
// In handlePointerDown:
if (e.button === 1) {  // middle click
  e.preventDefault();
  this.isRotating = true;
  this.lastPointerPos = { x: e.clientX, y: e.clientY };
}

// In handlePointerMove:
if (this.isRotating && this.lastPointerPos) {
  const dx = e.clientX - this.lastPointerPos.x;
  // Horizontal mouse movement = rotation. 0.5 degrees per pixel.
  this.camera.rotate(dx * 0.5);
  this.lastPointerPos = { x: e.clientX, y: e.clientY };
}

// In handlePointerUp:
if (e.button === 1) {
  this.isRotating = false;
  this.lastPointerPos = null;
}
```

### Shift + mouse wheel → rotate (optional alternative)

```typescript
// In handleWheel:
if (e.shiftKey) {
  const delta = -Math.sign(e.deltaY) * 5;  // 5° per scroll tick
  this.camera.rotate(delta);
} else {
  // Normal zoom
  const delta = -Math.sign(e.deltaY) * 0.1;
  this.camera.zoomAt(screenX, screenY, delta);
}
```

### Right-click drag → pan (moved from left-click)

```typescript
// In handlePointerDown:
if (e.button === 2) {  // right click
  this.isPanning = true;
  this.lastPointerPos = { x: e.clientX, y: e.clientY };
}

// Suppress context menu:
this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
```

### Keyboard

| Key | Action |
|---|---|
| Home / F | Reset to auto-orient view (position, zoom, AND rotation) |
| Q | Rotate left 15° |
| E | Rotate right 15° |
| Arrow keys | Pan |

### Mobile touch

| Gesture | Action |
|---|---|
| Two-finger rotate | Rotate camera (detect angle change between touches) |

Two-finger rotate detection:

```typescript
// Track angle between two touch points
const angle = Math.atan2(
  touch2.clientY - touch1.clientY,
  touch2.clientX - touch1.clientX
);

// On touchstart: store initial angle
this.pinchStartAngle = angle;

// On touchmove: calculate delta
const angleDelta = (angle - this.pinchStartAngle) * (180 / Math.PI);
this.camera.rotate(angleDelta);
this.pinchStartAngle = angle;  // reset for next move
```

This happens simultaneously with pinch-to-zoom — both rotation and zoom from the same two-finger gesture.

## Step 6: Rotation Controls UI

Create `src/ui/components/RotationControls.ts`:

A small control panel positioned to the left of the zoom controls.

### Layout

```
┌──────┐  ┌──────┐
│  ↶   │  │  +   │
│  ┃   │  │  ┃   │
│  ●   │  │  ●   │  ← rotation slider (left), zoom slider (right)
│  ┃   │  │  ┃   │
│  ↷   │  │  -   │
│  ↺   │  │  ⊞   │
└──────┘  └──────┘
```

### Implementation

- Vertical slider: 0° to 360°
- ↶ button: rotate left 15°
- ↷ button: rotate right 15°
- ↺ button: reset to auto-orient angle (not 0°)
- Style: same as zoom controls (cyber aesthetic, semi-transparent dark background)
- Position: `right: 70px` (zoom controls are at `right: 16px`)

### Slider sync

Do NOT use a separate `requestAnimationFrame` loop. Instead, expose a `sync()` method:

```typescript
class RotationControls {
  sync(): void {
    const current = Math.round(this.camera.getRotation());
    if (current !== this.lastKnown) {
      this.lastKnown = current;
      this.slider.value = String(current);
    }
  }
}
```

Call `sync()` from the main game loop each frame, alongside the zoom slider sync.

### Acceptance criteria for Part B
- [ ] Camera rotates around origin (Sun position)
- [ ] Auto-orient on game start: local player homeworld on left side
- [ ] Home key returns to auto-orient view (not rotation 0°)
- [ ] Middle-click drag rotates
- [ ] Shift + mouse wheel rotates
- [ ] Q/E keys rotate 15°
- [ ] All text (unit counts, fleet labels, avatar badges) stays readable at any rotation
- [ ] Avatar badges stay visually "above" their planets at any rotation
- [ ] Parallax background rotates at reduced rate
- [ ] Rotation slider syncs with all input methods
- [ ] Two-finger rotate on mobile
- [ ] Lasso selection works correctly with rotation applied
- [ ] Fleet hit-testing works correctly with rotation applied
- [ ] Smooth interpolation across the 0°/360° boundary
- [ ] Build passes

---

# ═══════════════════════════════════════════════════════════════
# PART C — TELEMETRY TRACKING SYSTEM
# ═══════════════════════════════════════════════════════════════

## Context

Balance tuning requires data. This adds a passive telemetry system that observes game events and captures metrics. It NEVER mutates game state.

## New Files

```
src/telemetry/
├── TelemetryTracker.ts
├── TelemetryTypes.ts
└── TelemetryAnalyzer.ts
```

## What to Track

### Sun balance
- Time of first capture
- Total ownership changes
- Hold time per player
- Contested time (Sun changed hands within last 30s window)
- Attack attempts vs successful captures
- Win rate correlation: did the longest Sun holder win?

### Planet type balance
- Per type: average time to first capture from neutral
- Per type: total ownership changes
- Per type: average garrison at game end
- Per type: what percentage the winner owned at game end (correlation)
- Flag types where winner owned 75%+ as "overperforming"

### Snowball detection
- Time-series snapshots every 10 seconds: planet count, total units, total production per player
- When did the winner first take the planet lead?
- How many times did the lead change?
- Snowball index: 0 (healthy back-and-forth) to 1 (early lead, never lost)

### Player economy
- Total units produced
- Idle time: seconds with any planet at max capacity (wasting production)
- Sun dividend bonus units gained
- Peak planets and peak total units
- Fleets sent, average fleet size, largest fleet
- Coordinated attacks (2+ fleets to same target within 3 seconds)
- Combat K/D ratio

### Map fairness
- Spawn distances to Sun per player
- Nearest neutral count per player
- Map generation retry count
- Auto-orient angle used

### AI assessment
- Did AI use coordinated attacks?
- AI fleet sizes vs player fleet sizes
- AI win rate by difficulty

## TelemetryTracker

### Wiring (same pattern as AudioManager):

```typescript
engine.on('fleet_launched', (e) => telemetry.onFleetLaunched(e));
engine.on('fleet_arrived', (e) => telemetry.onFleetArrived(e));
engine.on('planet_captured', (e) => telemetry.onPlanetCaptured(e));
engine.on('game_over', (e) => telemetry.onGameOver(e));

// In game loop, each frame after engine.tick(dt):
telemetry.tick(engine.getState(), dt);

// On game end:
telemetry.finalize(engine.getState(), winner);
```

### Performance

- No allocations in the tick hot path
- Pre-allocate all structures in constructor
- Snapshot every 10 seconds (not every frame)
- No string operations or JSON during gameplay — only at finalize()
- Target: < 0.1ms per frame overhead

### Output

On game end:

1. Human-readable summary to console:
```
=== NODE WARS TELEMETRY ===
Game: a1b2c3 | 2:34 | Winner: Player 1 | Medium | Balanced
Sun: first capture 28s, 3 changes, balanced
Snowball: healthy (0.23)
Pacing: good (154s)
Lava World: ⚠ winner owned 80%
```

2. Full JSON to console (for copy-paste analysis)

3. Stored in Zustand store for UI display

## TelemetryAnalyzer

Derives balance insights from raw data:

- Sun verdict: 'balanced' / 'too_strong' / 'too_weak' / 'ignored'
  - Captured under 15s → too_weak
  - Never captured → ignored
  - 0-1 changes after first capture → too_strong
  - Winner held 60%+ of game → too_strong
  - Otherwise → balanced
- Snowball index: 0-1 based on lead timing and reversal count
- Pacing: under 60s = too_fast, 60-300s = good, over 300s = too_slow
- Type flags: winner owned 75%+ of a type → overperforming

## Post-Game Display

Add a collapsible "Balance Data" section below existing post-game stats:

```
─── BALANCE DATA ──── [▼ expand]
Sun: Balanced — 3 ownership changes
  First capture: 28s (Player 1)
Snowball: Healthy (index 0.23)
Pacing: Good (154s)
Type Performance:
  ⚠ Lava World — winner owned 80%
  ✓ Terran — evenly split
AI: 6 coordinated attacks, avg fleet 1.2k
```

Styled in existing monospace cyber aesthetic. Starts collapsed. Warning indicators in yellow/orange for flagged imbalances.

### Acceptance criteria for Part C
- [ ] TelemetryTracker captures all listed metrics
- [ ] 10-second snapshots with player state
- [ ] Sun tracking complete (first capture, changes, hold times, contested)
- [ ] Per-player fleet/combat/economy tracking
- [ ] Per-type capture times, ownership changes, winner correlation
- [ ] Coordinated attack detection
- [ ] Snowball index calculation
- [ ] Human-readable + JSON console output at game end
- [ ] Balance insights displayed on post-game screen (collapsible)
- [ ] Zero gameplay impact
- [ ] Build passes, all tests pass

---

# ═══════════════════════════════════════════════════════════════
# TESTING
# ═══════════════════════════════════════════════════════════════

## Unit tests

**`InputManager.test.ts`** (new or extend):
- Left click on empty space + drag → lasso state active
- Left click on planet → fleet selection (not lasso)
- Lasso rectangle captures correct planets
- Lasso on empty area with no planets → deselects all

**`Camera.test.ts`** (extend):
- worldToScreen/screenToWorld round-trip with rotation applied
- Rotation wrap-around: 350° + 20° = 10°
- shortestAngleDelta: 350° to 10° = +20° (not -340°)
- applyTransform produces correct canvas state
- fitBounds with rotation parameter sets correct rotation

**`TelemetryTracker.test.ts`** (new):
- Initialize → map metrics recorded
- Fleet launched event → fleetsSent increments
- Planet captured (Sun) → Sun tracking updates
- Tick for 10+ seconds → snapshot captured
- Finalize → derived metrics calculated

**`TelemetryAnalyzer.test.ts`** (new):
- Sun never captured → 'ignored'
- Sun captured at 5s → 'too_weak'
- Sun changed hands 4 times → 'balanced'
- Winner led from snapshot 1, no reversals → high snowball index

## Manual testing checklist

- [ ] Start game on landscape screen. Homeworld appears on left.
- [ ] Start game on portrait phone. Homeworld appears on bottom (or top).
- [ ] Middle-click drag rotates the world around the Sun.
- [ ] All unit counts remain readable at 90°, 180°, 270° rotation.
- [ ] Avatar badges stay above their planets at all rotations.
- [ ] Right-click drag pans. Left-click drag on empty draws selection box.
- [ ] Left-click drag on owned planet sends fleet (not lasso).
- [ ] Lasso select multiple planets → drag from one to target → all send.
- [ ] Home key returns to auto-oriented view.
- [ ] Play full game. Check console for telemetry output at game end.
- [ ] Verify telemetry Balance Data section visible on post-game screen.
- [ ] Parallax background rotates subtly when world rotates.
- [ ] Fleet hit-testing works at non-zero rotation.
- [ ] Zoom toward cursor works correctly with rotation active.

---

## Build and verify

```bash
npx tsc --noEmit
npm run build
npm test
```

All must pass. When complete, create `prompts/PHASE_2_6_SUMMARY.md` documenting:
- What was built
- The auto-orient behavior observed
- Input scheme confirmation
- Sample telemetry output from one test game
- Any deviations from this spec
