# PHASE 2 — Camera System: Zoom, Pan, and Parallax

## Context

The game currently generates planet positions relative to the viewport — a larger browser window produces a larger, more spread-out map, while a small window crams everything together. This creates inconsistent experiences across devices and makes large maps with many bots visually chaotic.

This phase introduces a **world-space coordinate system** with a **camera/viewport** that supports zoom and pan. This is a foundational architectural change that decouples the game world from the screen, enabling consistent map layouts regardless of window size.

**What changes:**
- Map generation outputs planets in fixed world-unit coordinates (not pixels)
- A Camera class transforms world coordinates → screen coordinates for rendering
- Player can zoom in/out and pan around the map
- Parallax depth layers make the starfield feel like deep space
- A zoom slider UI element gives direct zoom control

**What does NOT change:**
- Engine, AI, combat, fleet movement, production — all game logic stays in world space and is unaffected
- Planet textures, shader pipeline, audio, UI overlays — unchanged
- The main canvas remains Canvas2D

**Ground rules:**
- Do NOT change game simulation logic. Fleets still move in world units. AI still operates in world units. Nothing in `engine/` changes except MapGenerator output coordinates.
- Do NOT break existing input. Click-drag on owned planets still sends fleets. Only click-drag on empty space triggers pan.
- All rendering must go through the camera transform. No direct pixel-coordinate drawing for gameplay elements.
- Run `npm run build` after each major step.

---

## Architecture

### New files

```
src/
├── camera/
│   ├── Camera.ts              # Core camera state: position, zoom, transforms
│   ├── CameraController.ts    # Input handling for zoom/pan (mouse, touch, keyboard)
│   └── CameraConstraints.ts   # Bounds, zoom limits, easing
```

### Modified files

```
src/
├── engine/map/
│   └── MapGenerator.ts        # Output world-space coordinates instead of screen-space
├── renderer/
│   ├── CanvasRenderer.ts      # Apply camera transform before rendering layers
│   ├── layers/
│   │   ├── BackgroundLayer.ts # Parallax offset at reduced rate
│   │   ├── PlanetLayer.ts     # Draw at camera-transformed positions
│   │   ├── FleetLayer.ts      # Draw at camera-transformed positions
│   │   ├── ParticleLayer.ts   # Draw at camera-transformed positions
│   │   ├── SelectionLayer.ts  # Draw drag lines in world space
│   │   └── HUDLayer.ts        # Draw in SCREEN space (not world space)
│   └── types.ts               # Add camera to RenderContext
├── input/
│   ├── InputManager.ts        # Convert screen coords → world coords for hit testing
│   └── InputMapper.ts         # Add wheel/pinch events
├── ui/components/
│   └── GameCanvas.ts          # Wire camera controller, add zoom slider DOM element
```

---

## Step 1: Camera Class

Create `src/camera/Camera.ts`. This is a pure data + math class with no DOM dependencies.

```typescript
interface CameraState {
  /** Camera center position in world coordinates. */
  x: number;
  y: number;
  /** Zoom level. 1.0 = default fit-all view. >1 = zoomed in. <1 = zoomed out. */
  zoom: number;
}

class Camera {
  private state: CameraState;
  private targetState: CameraState;    // for smooth interpolation
  private viewportWidth: number;
  private viewportHeight: number;

  constructor(viewportWidth: number, viewportHeight: number);

  // ─── Core transforms ───────────────────────────────

  /** Convert world coordinates to screen (canvas pixel) coordinates. */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number };

  /** Convert screen coordinates to world coordinates. */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number };

  /**
   * Convert a world-space distance/radius to screen-space pixels.
   * Used for planet radii, fleet sizes, etc.
   */
  worldToScreenScale(worldDistance: number): number;

  /**
   * Apply the camera transform to a canvas context.
   * Call this before rendering world-space layers.
   * Translates and scales the context so that drawing in world coordinates
   * appears at the correct screen position.
   */
  applyTransform(ctx: CanvasRenderingContext2D): void;

  /**
   * Reset the canvas context transform.
   * Call this before rendering screen-space layers (HUD, overlays).
   */
  resetTransform(ctx: CanvasRenderingContext2D): void;

  // ─── Camera movement ───────────────────────────────

  /** Pan the camera by a screen-space delta. */
  pan(screenDeltaX: number, screenDeltaY: number): void;

  /**
   * Zoom toward a screen-space point.
   * The world point under the cursor should stay fixed on screen.
   */
  zoomAt(screenX: number, screenY: number, zoomDelta: number): void;

  /** Set zoom level directly (for slider). */
  setZoom(zoom: number): void;

  /** Set camera position directly. */
  setPosition(worldX: number, worldY: number): void;

  /**
   * Smoothly animate camera to fit the given world-space bounds.
   * Used on game start and when pressing a "fit all" button.
   */
  fitBounds(bounds: WorldBounds, padding?: number): void;

  /** Update viewport dimensions (on resize). */
  setViewport(width: number, height: number): void;

  /**
   * Tick: interpolate current state toward target state for smooth movement.
   * Call once per frame. Uses lerp with a smoothing factor.
   */
  update(dt: number): void;

  // ─── Getters ───────────────────────────────────────

  getState(): Readonly<CameraState>;
  getZoom(): number;
  getWorldBoundsVisible(): WorldBounds;  // What portion of the world is currently visible
  getViewport(): { width: number; height: number };
}

interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
```

### The camera transform math

The core of the camera is this transformation:

```
screenX = (worldX - camera.x) * zoom + viewportWidth / 2
screenY = (worldY - camera.y) * zoom + viewportHeight / 2
```

And the inverse:

```
worldX = (screenX - viewportWidth / 2) / zoom + camera.x
worldY = (screenY - viewportHeight / 2) / zoom + camera.y
```

This means:
- `camera.x, camera.y` is the world-space point at the center of the screen
- `zoom` scales the world. zoom=2 means things appear twice as large.

### applyTransform implementation

Instead of manually transforming every draw call, use the canvas context's built-in transform:

```typescript
applyTransform(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  // Move origin to center of viewport
  ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
  // Apply zoom
  ctx.scale(this.state.zoom, this.state.zoom);
  // Move to camera position
  ctx.translate(-this.state.x, -this.state.y);
  // Now drawing in world coordinates "just works"
}

resetTransform(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
```

After calling `applyTransform`, any `ctx.fillRect(worldX, worldY, ...)` or `ctx.arc(worldX, worldY, worldRadius, ...)` will appear at the correct screen position automatically. This means most layer code needs minimal changes — just ensure they're drawing in world coordinates (which they already are, since planet positions are in world coordinates).

### Smooth interpolation

The camera should feel buttery. Don't snap to the target state — lerp toward it:

```typescript
update(dt: number): void {
  const smoothing = 1 - Math.pow(0.001, dt);  // frame-rate independent smoothing
  this.state.x = lerp(this.state.x, this.targetState.x, smoothing);
  this.state.y = lerp(this.state.y, this.targetState.y, smoothing);
  this.state.zoom = lerp(this.state.zoom, this.targetState.zoom, smoothing);
}
```

When calling `pan()`, `zoomAt()`, etc., modify `targetState` not `state`. The `update()` call each frame smoothly moves `state` toward `targetState`.

For instant moves (like `fitBounds` on game start), set both `state` and `targetState` to the same value.

### Zoom-toward-cursor math

This is the most important UX detail. When the user scrolls to zoom, the world point under their cursor must stay fixed on screen. This prevents the disorienting "zoom drifts away from what I'm looking at" problem.

```typescript
zoomAt(screenX: number, screenY: number, zoomDelta: number): void {
  // World point currently under cursor
  const worldBefore = this.screenToWorld(screenX, screenY);

  // Apply zoom change
  this.targetState.zoom = clamp(
    this.targetState.zoom * (1 + zoomDelta),
    this.minZoom,
    this.maxZoom
  );

  // World point now under cursor (with new zoom, old camera position)
  const worldAfter = this.screenToWorld(screenX, screenY);

  // Shift camera to compensate, keeping the original world point fixed
  this.targetState.x += worldBefore.x - worldAfter.x;
  this.targetState.y += worldBefore.y - worldAfter.y;
}
```

---

## Step 2: Camera Constraints

Create `src/camera/CameraConstraints.ts`:

```typescript
interface CameraConstraints {
  /** Minimum zoom level (zoomed out). Calculated to fit entire map. */
  minZoom: number;
  /** Maximum zoom level (zoomed in). */
  maxZoom: number;
  /** World-space bounds the camera center cannot leave. */
  worldBounds: WorldBounds;
  /** Padding in world units around the world bounds. */
  boundsPadding: number;
}
```

### Zoom limits

- **minZoom**: Calculated dynamically so that at minimum zoom, the entire map fits in the viewport with padding. Formula: `minZoom = min(viewportWidth / worldWidth, viewportHeight / worldHeight) * 0.85` (the 0.85 gives ~15% padding). Recalculate on viewport resize.
- **maxZoom**: Fixed at `3.0`. At 3x zoom, planets are large enough to see all detail and unit counts are very readable. Adjust if it feels too much or too little.
- **Default zoom on game start**: Call `fitBounds()` with the bounding box of all planets. This becomes the player's starting view.

### Pan bounds

Don't let the camera pan so far that the entire map is off screen. Constrain `camera.x` and `camera.y` so that the visible viewport always overlaps with the world bounds (with some generous padding so you can pan a bit past the edge planets):

```typescript
constrainPosition(state: CameraState, constraints: CameraConstraints, viewport: { width: number; height: number }): CameraState {
  const halfViewW = viewport.width / (2 * state.zoom);
  const halfViewH = viewport.height / (2 * state.zoom);
  const bounds = constraints.worldBounds;
  const pad = constraints.boundsPadding;

  return {
    ...state,
    x: clamp(state.x, bounds.minX - pad, bounds.maxX + pad),
    y: clamp(state.y, bounds.minY - pad, bounds.maxY + pad),
  };
}
```

---

## Step 3: Camera Controller

Create `src/camera/CameraController.ts`. This handles DOM input events and drives the Camera.

```typescript
class CameraController {
  private camera: Camera;
  private isPanning: boolean;
  private lastPointerPos: { x: number; y: number } | null;
  private pinchStartDistance: number | null;
  private pinchStartZoom: number;

  constructor(camera: Camera, canvas: HTMLCanvasElement);

  /** Attach event listeners. */
  attach(): void;

  /** Detach event listeners. */
  detach(): void;
}
```

### Desktop input

| Input | Action |
|---|---|
| **Mouse wheel** | Zoom in/out at cursor position |
| **Middle-click drag** | Pan the camera |
| **Right-click drag** | Pan the camera (alternative) |
| **Left-click drag on empty space** | Pan the camera |
| **Left-click drag on owned planet** | Fleet selection (existing behavior, NOT pan) |

The key distinction: **left-click drag** needs to check whether the mousedown hit a planet. If it did → fleet mode (handled by existing InputManager). If it didn't → pan mode (handled by CameraController).

**Implementation approach**: The CameraController and InputManager both listen to pointer events. They need to coordinate. Two options:

**Option A (recommended)**: InputManager gets first pass on mousedown. If it hits an owned planet, it claims the interaction (sets a flag). CameraController checks that flag — if InputManager claimed it, CameraController ignores the drag. If InputManager didn't claim it (empty space hit), CameraController handles it as a pan.

**Option B**: A single InputCoordinator dispatches to the appropriate handler. More complex but cleaner separation.

Go with Option A — it's simpler and the InputManager already does planet hit-testing.

Expose a method on InputManager:

```typescript
/** Returns true if the InputManager is currently handling a fleet-selection drag. */
isInteracting(): boolean;
```

CameraController checks this on mousedown/mousemove:

```typescript
onPointerDown(e: PointerEvent): void {
  // Don't start pan if InputManager is handling a fleet interaction
  if (this.inputManager.isInteracting()) return;

  // Left button on empty space, or middle button anywhere
  if (e.button === 0 || e.button === 1) {
    this.isPanning = true;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  }
}

onPointerMove(e: PointerEvent): void {
  if (!this.isPanning || !this.lastPointerPos) return;

  const dx = e.clientX - this.lastPointerPos.x;
  const dy = e.clientY - this.lastPointerPos.y;
  this.camera.pan(dx, dy);
  this.lastPointerPos = { x: e.clientX, y: e.clientY };
}
```

### Mouse wheel zoom

```typescript
onWheel(e: WheelEvent): void {
  e.preventDefault();
  const rect = this.canvas.getBoundingClientRect();
  const screenX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
  const screenY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

  // Normalize wheel delta across browsers
  const delta = -Math.sign(e.deltaY) * 0.1;  // 10% zoom per scroll tick
  this.camera.zoomAt(screenX, screenY, delta);
}
```

### Touch input (mobile)

| Gesture | Action |
|---|---|
| **One-finger drag on empty space** | Pan |
| **One-finger drag on owned planet** | Fleet selection (existing) |
| **Two-finger pinch** | Zoom in/out centered between fingers |
| **Two-finger drag** | Pan (while pinching) |

Pinch detection:

```typescript
onTouchStart(e: TouchEvent): void {
  if (e.touches.length === 2) {
    // Start pinch
    const d = this.getTouchDistance(e.touches[0], e.touches[1]);
    this.pinchStartDistance = d;
    this.pinchStartZoom = this.camera.getZoom();
    const center = this.getTouchCenter(e.touches[0], e.touches[1]);
    this.pinchCenter = center;
  }
}

onTouchMove(e: TouchEvent): void {
  if (e.touches.length === 2 && this.pinchStartDistance !== null) {
    e.preventDefault();
    const d = this.getTouchDistance(e.touches[0], e.touches[1]);
    const scale = d / this.pinchStartDistance;
    const newZoom = this.pinchStartZoom * scale;

    const center = this.getTouchCenter(e.touches[0], e.touches[1]);
    const rect = this.canvas.getBoundingClientRect();
    const screenX = (center.x - rect.left) * (this.canvas.width / rect.width);
    const screenY = (center.y - rect.top) * (this.canvas.height / rect.height);

    this.camera.setZoom(newZoom);
    // Also handle pan from pinch center movement
    // ...
  }
}
```

### Keyboard shortcuts

| Key | Action |
|---|---|
| **+** / **=** | Zoom in |
| **-** | Zoom out |
| **Home** or **F** | Fit-all (reset to default view) |
| **Arrow keys** | Pan (while held) |

Arrow key pan should be smooth — track held-down state and apply pan velocity each frame, not on keypress.

---

## Step 4: World-Space Map Generation

### Change MapGenerator output

Currently MapGenerator takes canvas width/height and positions planets in pixel coordinates. Change it to output in fixed world-unit coordinates.

Define a standard world size:

```typescript
// In constants/game.ts
const WORLD_SIZES = {
  small: { width: 1200, height: 900 },
  medium: { width: 1800, height: 1200 },
  large: { width: 2600, height: 1600 },
} as const;
```

MapGenerator should accept a `WorldSize` parameter (or `mapSize` key) instead of raw pixel dimensions:

```typescript
function generatePlanets(
  config: MapConfig
): Planet[] {
  const worldSize = WORLD_SIZES[config.mapSize]; // e.g. 'medium'
  const w = worldSize.width;
  const h = worldSize.height;
  // ... existing generation logic using w, h as world units
  // Planet positions, radii, spacing — all in world units now
}
```

The numbers themselves don't change much — a planet at position (400, 300) with radius 45 is the same whether those are pixels or world units. What changes is that the renderer applies the camera transform to map these to screen pixels.

### Planet spacing

With camera zoom, you can now afford more generous spacing between planets. Increase the minimum spacing slightly:

```typescript
// Old: p.r + other.r + 50
// New: more breathing room since the player can zoom in
const MIN_SPACING_FACTOR = 1.8; // multiplier on combined radii
const minSpacing = (p.r + other.r) * MIN_SPACING_FACTOR + 40;
```

This makes zoomed-out views less cluttered and zoomed-in views feel more like distinct locations.

---

## Step 5: Renderer Integration

### CanvasRenderer changes

The CanvasRenderer needs access to the Camera. Add it to the render context:

```typescript
interface RenderContext {
  // ... existing fields
  camera: Camera;
}
```

The main render loop becomes:

```typescript
render(gameState: Readonly<GameState>, dt: number): void {
  const ctx = this.ctx;
  const camera = this.camera;
  const w = this.canvas.width;
  const h = this.canvas.height;

  // Update camera interpolation
  camera.update(dt);

  // 1. Clear entire canvas
  ctx.clearRect(0, 0, w, h);

  // 2. Draw background layers WITH PARALLAX (custom transform per layer)
  this.backgroundLayer.render(ctx, renderContext);

  // 3. Apply camera transform for world-space layers
  camera.applyTransform(ctx);

  // 4. Draw world-space layers
  //    Only draw elements that are within the visible world bounds
  //    (frustum culling for performance)
  this.selectionLayer.render(ctx, renderContext);
  this.trailLayer.render(ctx, renderContext);  // if separate from particles
  this.fleetLayer.render(ctx, renderContext);
  this.planetLayer.render(ctx, renderContext);
  this.particleLayer.render(ctx, renderContext);

  // 5. Reset transform for screen-space layers
  camera.resetTransform(ctx);

  // 6. Draw screen-space HUD (always same size regardless of zoom)
  this.hudLayer.render(ctx, renderContext);
}
```

### Layer changes

**Most layers need zero or minimal changes.** Because `camera.applyTransform(ctx)` sets up the canvas context transform, any existing code that draws at `planet.x, planet.y` with `planet.r` radius will automatically appear at the correct screen position and scale. The canvas transform handles everything.

Specific layers that need attention:

**BackgroundLayer** — does NOT use the main camera transform. Instead, it applies its own reduced-rate parallax transform (see Step 6).

**HUDLayer** — draws in screen space. Must NOT be inside the camera transform. The top bar stats, pause overlay, etc. should always appear at the same screen position regardless of zoom/pan.

**PlanetLayer** — mostly fine, but the unit count text and avatar badges need to be carefully sized. At high zoom, text drawn at world-scale will appear large. You have two options:

- **Option A (simpler)**: Let text scale with zoom. At high zoom, numbers are big and readable. At low zoom, they're small. This is natural and works well for moderate zoom ranges.
- **Option B (more polished)**: Draw text at a fixed screen-space size. After drawing the planet body (in world space), calculate the screen position and draw text outside the camera transform at that position. This keeps text always readable but requires more work.

**Recommend Option A** for now. With a zoom range of ~0.5x to 3x, world-space text remains readable at all levels.

**ParticleLayer / TrailLayer** — particles are in world coordinates, so they transform automatically. However, particle SIZE might look weird at extreme zoom. At 3x zoom, a 3px particle becomes 9 screen pixels. Consider clamping visual particle size:

```typescript
const screenSize = particle.size * camera.getZoom();
const clampedSize = Math.min(screenSize, 6); // never larger than 6 screen pixels
const worldSize = clampedSize / camera.getZoom();
// draw at worldSize
```

This is a polish detail — skip it initially and add if particles look bloated at high zoom.

**SelectionLayer** — drag lines are in world space, so they work automatically. The dashed-line dash pattern might look different at various zoom levels. If the dashes appear too large when zoomed in, scale the dash lengths inversely with zoom.

### Frustum culling (performance optimization)

With a camera, much of the world may be off-screen when zoomed in. Don't waste draw calls on invisible objects.

```typescript
// In each layer's render method, or as a utility:
function isVisible(worldX: number, worldY: number, worldRadius: number, camera: Camera): boolean {
  const visibleBounds = camera.getWorldBoundsVisible();
  return (
    worldX + worldRadius > visibleBounds.minX &&
    worldX - worldRadius < visibleBounds.maxX &&
    worldY + worldRadius > visibleBounds.minY &&
    worldY - worldRadius < visibleBounds.maxY
  );
}

// In PlanetLayer:
for (const planet of gameState.planets) {
  if (!isVisible(planet.x, planet.y, planet.r + 20, camera)) continue; // +20 for glow
  // ... render planet
}
```

Similarly for fleets and particles. This is especially impactful with large maps and high zoom — you might only be rendering 3-4 of 20 planets.

---

## Step 6: Parallax Background

This is where the visual magic happens. The starfield and nebula should move at a fraction of the camera's movement, creating depth.

### Parallax layer concept

Define parallax depths:

```typescript
const PARALLAX_LAYERS = {
  nebula: 0.02,      // barely moves — feels infinitely far away
  stars: 0.05,       // subtle drift
  grid: 0.3,         // moves noticeably but slower than gameplay
  // gameplay elements: 1.0 (full camera transform, handled by camera.applyTransform)
} as const;
```

A parallax factor of 0.05 means: when the camera pans 100 world units, this layer shifts only 5 world units.

### BackgroundLayer implementation

The BackgroundLayer should NOT use `camera.applyTransform()`. Instead, it applies its own transform per sub-layer:

```typescript
render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
  const camera = context.camera;
  const cameraState = camera.getState();
  const vw = context.canvasWidth;
  const vh = context.canvasHeight;

  // ─── Nebula layer (parallax 0.02) ──────────────────
  // The nebula canvas was pre-rendered at init. Draw it with slight offset.
  const nebulaOffsetX = -cameraState.x * PARALLAX_LAYERS.nebula;
  const nebulaOffsetY = -cameraState.y * PARALLAX_LAYERS.nebula;
  // Parallax zoom: nebula barely scales when zooming
  const nebulaZoom = 1 + (cameraState.zoom - 1) * PARALLAX_LAYERS.nebula;

  ctx.save();
  ctx.translate(vw / 2, vh / 2);
  ctx.scale(nebulaZoom, nebulaZoom);
  ctx.translate(-vw / 2 + nebulaOffsetX, -vh / 2 + nebulaOffsetY);
  // Draw nebula canvas (tiled or oversized to cover any pan range)
  ctx.drawImage(this.nebulaCanvas, 0, 0, vw, vh);
  ctx.restore();

  // ─── Star layer (parallax 0.05) ────────────────────
  const starOffsetX = -cameraState.x * PARALLAX_LAYERS.stars;
  const starOffsetY = -cameraState.y * PARALLAX_LAYERS.stars;
  const starZoom = 1 + (cameraState.zoom - 1) * PARALLAX_LAYERS.stars;

  ctx.save();
  ctx.translate(vw / 2, vh / 2);
  ctx.scale(starZoom, starZoom);
  ctx.translate(-vw / 2 + starOffsetX, -vh / 2 + starOffsetY);
  this.drawStars(ctx, context);
  ctx.restore();

  // ─── Grid layer (parallax 0.3) ─────────────────────
  const gridOffsetX = -cameraState.x * PARALLAX_LAYERS.grid;
  const gridOffsetY = -cameraState.y * PARALLAX_LAYERS.grid;
  const gridZoom = 1 + (cameraState.zoom - 1) * PARALLAX_LAYERS.grid;

  ctx.save();
  ctx.translate(vw / 2, vh / 2);
  ctx.scale(gridZoom, gridZoom);
  ctx.translate(-vw / 2 + gridOffsetX, -vh / 2 + gridOffsetY);
  this.drawGrid(ctx, context);
  ctx.restore();
}
```

### Background sizing

The nebula and starfield canvases need to be large enough that parallax panning never reveals blank edges. Since parallax factor is very low (0.02-0.05), the background barely moves — but with a large map and full pan range, you might shift 50-100 pixels at the background layer.

**Solution**: Generate the nebula/star backgrounds at `viewport size + 200px` in each direction, centered. This buffer handles any parallax offset. Regenerate on viewport resize.

---

## Step 7: Zoom Slider UI

Add a small zoom slider in the bottom-right corner of the game screen. This is a DOM element overlaying the canvas (not drawn on canvas).

### Design

```
┌─────────────────────────────────────┐
│                                     │
│          (game canvas)              │
│                                     │
│                                     │
│                            ┌──────┐ │
│                            │  +   │ │
│                            │  ┃   │ │
│                            │  ┃   │ │
│                            │  ●   │ │  ← zoom slider (vertical)
│                            │  ┃   │ │
│                            │  ┃   │ │
│                            │  -   │ │
│                            │ [⊞]  │ │  ← fit-all button
│                            └──────┘ │
└─────────────────────────────────────┘
```

### Implementation

Create this as a DOM element in `GameCanvas.ts` (or a new `ZoomControls.ts` UI component):

```typescript
function createZoomControls(
  camera: Camera,
  container: HTMLElement
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'zoom-controls';
  // Position: absolute, bottom-right, with z-index above canvas

  // Zoom in button
  const zoomIn = document.createElement('button');
  zoomIn.textContent = '+';
  zoomIn.addEventListener('click', () => {
    camera.zoomAt(
      camera.getViewport().width / 2,
      camera.getViewport().height / 2,
      0.2
    );
  });

  // Slider (vertical)
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.orient = 'vertical';  // Firefox
  slider.style.writingMode = 'vertical-lr';  // Chrome
  slider.style.direction = 'rtl';  // So top = max zoom
  slider.addEventListener('input', () => {
    const t = parseInt(slider.value) / 100;
    const minZ = camera.getMinZoom();
    const maxZ = camera.getMaxZoom();
    // Exponential interpolation for natural zoom feel
    const zoom = minZ * Math.pow(maxZ / minZ, t);
    camera.setZoom(zoom);
  });

  // Zoom out button
  const zoomOut = document.createElement('button');
  zoomOut.textContent = '-';
  zoomOut.addEventListener('click', () => {
    camera.zoomAt(
      camera.getViewport().width / 2,
      camera.getViewport().height / 2,
      -0.2
    );
  });

  // Fit-all button
  const fitAll = document.createElement('button');
  fitAll.textContent = '⊞';
  fitAll.title = 'Fit all planets (Home)';
  fitAll.addEventListener('click', () => {
    camera.fitBounds(getWorldBounds(gameState.planets), 100);
  });

  wrapper.append(zoomIn, slider, zoomOut, fitAll);
  container.appendChild(wrapper);

  // Update slider when camera zoom changes
  // (call this each frame or on camera change)
  return wrapper;
}
```

### Slider sync

The slider must stay in sync with the camera zoom (which can change from mousewheel or pinch independently of the slider). Each frame, update the slider value:

```typescript
function syncZoomSlider(slider: HTMLInputElement, camera: Camera): void {
  const minZ = camera.getMinZoom();
  const maxZ = camera.getMaxZoom();
  const t = Math.log(camera.getZoom() / minZ) / Math.log(maxZ / minZ);
  slider.value = String(Math.round(t * 100));
}
```

### Styling

Keep it consistent with the cyber aesthetic. The zoom controls should be subtle — semi-transparent dark background, accent color on hover, monospace text. Don't let it dominate the screen.

```css
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(5, 8, 15, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.15);
  z-index: 5;
  pointer-events: auto;
}

.zoom-controls button {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: #00e5ff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  cursor: pointer;
}

.zoom-controls button:hover {
  background: rgba(0, 229, 255, 0.15);
}
```

---

## Step 8: Input Manager Updates

The InputManager currently works in screen coordinates that are also world coordinates (since they were the same). Now screen and world coordinates differ.

### Hit testing

`InputManager.findPlanet()` currently checks cursor distance against planet positions. These planet positions are in world coordinates, but the cursor position is in screen coordinates. Convert the cursor to world space before hit testing:

```typescript
findPlanet(screenPos: Vec2): Planet | null {
  const worldPos = this.camera.screenToWorld(screenPos.x, screenPos.y);
  for (const planet of this.planets) {
    if (dist(worldPos, planet) < planet.r + 10) return planet;
  }
  return null;
}
```

### Drag line

The drag line endpoint (where the cursor is) needs to be in world coordinates for the SelectionLayer to draw it correctly:

```typescript
// When updating drag position:
const screenPos = getCanvasPos(e);
const worldPos = this.camera.screenToWorld(screenPos.x, screenPos.y);
this.dragLine = { x: worldPos.x, y: worldPos.y };
```

### Interaction priority

Add the `isInteracting()` method so CameraController knows not to pan:

```typescript
isInteracting(): boolean {
  return this.selection.size > 0 && this.dragLine !== null;
}
```

---

## Step 9: Minimap (Optional, Nice-to-Have)

If time permits, add a small minimap in the bottom-left corner showing the entire map at all times. This helps orientation when zoomed in.

### Design

- Small rectangle (150x100px) with semi-transparent background
- Shows all planets as colored dots (owner color)
- Shows a white/cyan rectangle representing the current camera viewport
- Click on the minimap to jump the camera to that position

This is a complete nice-to-have. Skip it if the core zoom/pan system takes longer than expected.

---

## Refactoring Sequence — Execute in Order

### Phase A: Camera foundation (no visual changes yet)
1. Create `Camera.ts` with all math methods
2. Create `CameraConstraints.ts`
3. Write unit tests for worldToScreen, screenToWorld, zoomAt
4. Verify: `npm run build` passes

### Phase B: Map generator → world space
5. Update `MapGenerator` to accept world-size config instead of viewport dimensions
6. Update `MapValidator` for new coordinate ranges
7. Update existing map generation tests
8. Verify: `npm run build` passes, tests pass

### Phase C: Renderer integration
9. Add Camera to `RenderContext`
10. Update `CanvasRenderer` to call `camera.applyTransform()` / `resetTransform()`
11. Update `InputManager` to convert screen→world for hit testing and drag
12. **Test the game**: it should look and play identically to before (camera at default fit-all position, zoom=1)
13. Verify: game plays correctly, no visual regression

### Phase D: Interaction
14. Create `CameraController` with mousewheel zoom
15. Add pan via middle-click and left-click-on-empty-space
16. Wire `isInteracting()` between InputManager and CameraController
17. **Test**: zoom in/out with mousewheel, pan with mouse drag, fleet selection still works
18. Verify: both zoom/pan and fleet interactions work without conflicts

### Phase E: Touch and slider
19. Add pinch-to-zoom and touch-pan to CameraController
20. Create zoom slider DOM element
21. Wire slider ↔ camera sync
22. Add keyboard shortcuts (+, -, Home, arrows)
23. **Test on mobile viewport** (Chrome DevTools device simulation)

### Phase F: Parallax
24. Update BackgroundLayer with parallax transforms per sub-layer
25. Ensure background canvases are large enough to cover parallax range
26. **Test**: pan around and verify starfield drifts slowly, nebula barely moves, gameplay layer moves fully
27. Verify: visual quality, no edge artifacts

### Phase G: Polish
28. Add frustum culling to all world-space layers
29. Tune zoom limits, pan bounds, smooth interpolation speed
30. Ensure HUD layer is fully screen-space and unaffected by zoom
31. Test at extreme zoom levels (min and max)
32. Performance profile at max zoom out with large map
33. Verify: `npm run build`, `npm test`, all passing

---

## Acceptance Criteria

### Must have
- [ ] Camera class with world↔screen coordinate transforms
- [ ] Map generation in fixed world-space coordinates (not viewport-dependent)
- [ ] Mousewheel zoom (toward cursor)
- [ ] Click-drag pan on empty space (left or middle mouse)
- [ ] No conflict between pan and fleet selection — dragging on planets still works
- [ ] Zoom slider in bottom-right corner with +/- buttons and fit-all button
- [ ] Camera smoothly interpolates (no snapping)
- [ ] Zoom-out limit fits entire map; zoom-in limit at 3x
- [ ] Game starts with camera auto-fit to show all planets
- [ ] All gameplay layers render correctly at all zoom levels
- [ ] HUD layer stays fixed in screen space
- [ ] Home/F key resets camera to fit-all view
- [ ] Build passes, all tests pass

### Should have
- [ ] Pinch-to-zoom on mobile/touch
- [ ] One-finger pan on mobile (on empty space)
- [ ] Parallax starfield/nebula (moves at 5% of camera)
- [ ] Parallax grid (moves at 30% of camera)
- [ ] Frustum culling for off-screen planets/fleets/particles
- [ ] Arrow key pan
- [ ] +/- key zoom
- [ ] Pan bounds (can't scroll infinitely past the map)

### Nice to have
- [ ] Minimap showing full map + viewport rectangle
- [ ] Smooth zoom momentum (coast after mousewheel)
- [ ] Double-click on planet to center camera on it
- [ ] Particle size clamping at high zoom

### Do NOT
- [ ] Do not change game simulation logic (engine, AI, combat, production)
- [ ] Do not change planet texture generation pipeline
- [ ] Do not change audio system
- [ ] Do not switch the main canvas from 2D to WebGL

---

## Testing

### Unit tests
- `Camera.test.ts`: worldToScreen/screenToWorld round-trip consistency, zoomAt keeps cursor-world-point fixed, fitBounds calculates correct zoom, pan constraints work
- `CameraConstraints.test.ts`: minZoom calculation for various viewport/world sizes

### Integration tests
- Start game → camera auto-fits → all planets visible
- Zoom in → pan → zoom out → camera returns to valid bounds
- Fleet selection works at non-default zoom levels

### Manual testing checklist
- [ ] Start game. All planets visible, centered.
- [ ] Mousewheel zoom in. Planets grow. Zoom targets cursor position.
- [ ] Mousewheel zoom out. Hits limit when full map is visible.
- [ ] Drag empty space. Camera pans.
- [ ] Drag owned planet. Fleet selection works (camera does NOT pan).
- [ ] Zoom in on a cluster of planets, play normally. Everything works.
- [ ] Zoom slider matches mousewheel zoom state.
- [ ] Click fit-all button. Camera resets.
- [ ] Press Home key. Camera resets.
- [ ] Resize browser window. Camera adjusts, no visual break.
- [ ] Mobile simulation: pinch works, one-finger pan works.
- [ ] Pan to edge of map. Camera stops (bounded).
- [ ] Large map with 6 bots. Zoomed out view is playable. Zoomed in view is clean.
- [ ] Background starfield parallax visible when panning.

---

## Build and verify

```bash
npx tsc --noEmit
npm run build
npm test
```

All must pass. When complete, create `prompts/PHASE_2_SUMMARY.md` documenting what was built, any deviations, and observations on how zoom/pan feels at different map sizes.
