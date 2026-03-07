# PHASE 1.5 — Procedural Pixel Planets via Raw WebGL

## Context

The game currently renders planets as flat colored circles with a silhouette avatar placeholder inside. We are replacing the planet visuals with procedurally generated pixel planets using fragment shaders ported from the open-source Deep-Fold PixelPlanets project (MIT licensed, https://github.com/Deep-Fold/PixelPlanets).

Player ownership is currently shown by the avatar being inside the planet circle. After this change, the planet circle becomes a rendered pixel planet, and the avatar moves to float above the planet as a small badge/indicator.

**Source material:**
- Original Godot shaders: https://github.com/Deep-Fold/PixelPlanets (Godot GLSL, MIT license)
- Existing JavaScript/Three.js port: https://github.com/Timur310/PixelPlanets (reference for GLSL translation)
- Deep-Fold also has a pure GLSL API repo: https://github.com/Deep-Fold/PixelPlanetsAPI

Use these repos as reference. The Godot shader language is a thin GLSL wrapper — the math translates almost 1:1 to WebGL fragment shaders. The Three.js port shows exactly how the uniforms map. The PixelPlanetsAPI repo may have the cleanest GLSL to reference.

**Approach:** Raw WebGL. No Three.js. Render planets to offscreen canvases at game init, cache as static textures, draw cached images onto the main 2D game canvas each frame. This means zero per-frame shader cost during gameplay.

**Ground rules:**
- Do NOT add Three.js or any rendering library. Raw WebGL2 (with WebGL1 fallback awareness).
- Do NOT break existing gameplay or visuals. Rings, glow, selection, HUD all remain.
- Do NOT change the engine, AI, input, or game logic. This is renderer-only.
- Keep the existing 2D canvas as the primary game renderer. WebGL is used only as an offline texture generator.
- All new code follows existing project patterns: typed, modular, separated.
- Run `npm run build` after each major step.

---

## Architecture

### New files to create

```
src/
├── planets/
│   ├── PlanetTextureGenerator.ts    # Orchestrates WebGL rendering of all planet textures
│   ├── WebGLShaderRenderer.ts       # Minimal WebGL2 context, compiles/runs fragment shaders
│   ├── shaders/
│   │   ├── common.glsl.ts           # Shared noise functions (fbm, hash, simplex, etc.) as TS string exports
│   │   ├── rivers.glsl.ts           # Rivers planet type fragment shader
│   │   ├── landmasses.glsl.ts       # Land masses planet type
│   │   ├── dryterran.glsl.ts        # Dry/terran planet type
│   │   ├── iceworld.glsl.ts         # Ice world planet type
│   │   ├── lavaworld.glsl.ts        # Lava world planet type
│   │   ├── gasplanet.glsl.ts        # Gas giant planet type
│   │   ├── noatmosphere.glsl.ts     # Barren/no atmosphere planet type
│   │   └── star.glsl.ts             # Star type (for variety)
│   ├── PlanetTypes.ts               # Planet type definitions, color palettes, uniform presets
│   └── PlanetTextureCache.ts        # Cache of rendered planet ImageBitmap/canvas objects
```

### How it fits into the existing architecture

```
Game Init
  └→ PlanetTextureGenerator.init()
       └→ Creates a hidden offscreen WebGL2 canvas (not added to DOM)
       └→ For each planet in the game state:
            └→ Picks a planet type based on planet ID seed
            └→ Compiles the appropriate fragment shader
            └→ Renders to offscreen canvas at target resolution
            └→ Optionally renders N rotation frames for animation
            └→ Stores result in PlanetTextureCache

Game Loop (each frame)
  └→ CanvasRenderer.render()
       └→ PlanetLayer.render()
            └→ For each planet:
                 └→ Reads cached texture from PlanetTextureCache
                 └→ Draws it with ctx.drawImage() clipped to circle
                 └→ Draws rings, glow, selection, unit count as before
                 └→ Draws avatar badge ABOVE the planet (new position)
```

---

## Step 1: WebGL Shader Renderer

Create `src/planets/WebGLShaderRenderer.ts` — a minimal, reusable WebGL2 utility class whose sole job is to compile a fragment shader and render it to a canvas/texture.

```typescript
class WebGLShaderRenderer {
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private quadVAO: WebGLVertexArrayObject;

  constructor(width: number, height: number);

  /**
   * Compile a fragment shader program. The vertex shader is always
   * a simple fullscreen quad passthrough (never changes).
   * Returns a program handle for later use.
   */
  compileShader(fragmentSource: string): WebGLProgram;

  /**
   * Render a compiled shader with given uniforms to the internal canvas.
   * Returns the canvas (or OffscreenCanvas) with the rendered result.
   */
  render(program: WebGLProgram, uniforms: Record<string, UniformValue>): void;

  /**
   * Get the current canvas content as an ImageBitmap for caching.
   */
  getImageBitmap(): Promise<ImageBitmap>;

  /**
   * Get the current canvas content as a regular canvas for immediate use.
   * (Fallback if ImageBitmap is not supported.)
   */
  getCanvasSnapshot(): HTMLCanvasElement;

  /** Cleanup GL resources. */
  destroy(): void;
}

type UniformValue =
  | { type: '1f'; value: number }
  | { type: '2f'; value: [number, number] }
  | { type: '3f'; value: [number, number, number] }
  | { type: '4f'; value: [number, number, number, number] }
  | { type: '1i'; value: number }
  | { type: 'color'; value: [number, number, number, number] }  // RGBA 0-1
  | { type: 'colorArray'; value: number[] };  // flat array of RGBA values
```

### Vertex shader (never changes)

This is the standard fullscreen-quad vertex shader. Hardcode it:

```glsl
#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

The quad is two triangles covering clip space (-1 to 1). UV coordinates go from 0 to 1.

### Uniform setting helper

Write a helper that takes the `Record<string, UniformValue>` and calls the appropriate `gl.uniform*` for each. This keeps the render call clean.

### OffscreenCanvas vs HTMLCanvasElement

Prefer `OffscreenCanvas` if available (better performance, doesn't need DOM). Fall back to a hidden `HTMLCanvasElement` if not supported:

```typescript
const canvas = typeof OffscreenCanvas !== 'undefined'
  ? new OffscreenCanvas(width, height)
  : document.createElement('canvas');
```

---

## Step 2: Port the Shaders

### What to port

Port these planet types from the Deep-Fold project. Each becomes a `.glsl.ts` file exporting a fragment shader string. Start with the subset that gives the most visual variety for a space strategy game:

| Planet Type | Visual | Use in Game |
|---|---|---|
| **Rivers** | Earth-like with rivers and land | Player home / high-value planets |
| **LandMasses** | Continents and oceans | Common habitable planets |
| **DryTerran** | Desert/arid world | Medium planets |
| **IceWorld** | Frozen, blue-white | Edge/corner planets |
| **LavaWorld** | Volcanic, red-orange glow | Contested/valuable planets |
| **GasPlanet** | Banded gas giant | Large planets |
| **NoAtmosphere** | Barren, cratered | Small/weak planets |
| **Star** | Glowing, pulsing | Optional: for map decoration |

That's 7-8 types, which is plenty of variety for 14 planets on a map.

### How the Godot shaders work

Each Godot shader follows the same pattern:

1. **Noise generation**: Uses fbm (fractal Brownian motion) built on a hash-based pseudo-random function. This is the core of all the procedural textures. The noise functions are shared across all planet types.

2. **UV manipulation**: Takes the flat UV (0-1), applies a `spherify()` function that distorts UVs to simulate a sphere (it's a 2D trick, not real 3D). Also applies pixelation by flooring UVs to a grid.

3. **Terrain/feature generation**: Uses noise with various thresholds to create land/water/rivers/clouds/lava/etc. Each planet type has its own logic here.

4. **Color mapping**: Maps noise values to color palettes. The Godot 4 version uses uniform color arrays.

5. **Lighting**: Simple directional light based on a `light_origin` uniform. Creates the lit/shadow sides of the planet.

6. **Circle mask**: Discards pixels outside a circle to make it round (`step(distance(uv, 0.5), 0.5)`).

7. **Rotation**: The `TIME` uniform scrolls the noise horizontally to simulate rotation.

### Porting from Godot GLSL to WebGL2 GLSL

Key translation differences:

| Godot Shader | WebGL2 GLSL (ES 3.0) |
|---|---|
| `shader_type canvas_item;` | Remove entirely |
| `void fragment()` | `void main()` |
| `UV` | `v_uv` (from vertex shader varying) |
| `COLOR` | Write to `out vec4 fragColor;` |
| `TIME` | `uniform float u_time;` |
| `uniform vec4 col1 : source_color` | `uniform vec4 u_col1;` |
| `SCREEN_PIXEL_SIZE` | `uniform vec2 u_resolution;` (pass canvas size) |

The noise functions (hash, fbm, etc.) translate directly — they're pure math.

### Shared common shader code

Create `src/planets/shaders/common.glsl.ts` containing the shared functions as a string:

```typescript
export const COMMON_SHADER_FUNCTIONS = `
// Pseudo-random hash
float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0, 1.0) * round(u_size));
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 2D noise
float noise(vec2 coord) {
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

// Fractal Brownian Motion
float fbm(vec2 coord, int octaves) {
  float value = 0.0;
  float scale = 0.5;
  for (int i = 0; i < 20; i++) {
    if (i >= octaves) break;
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

// Spherify UV distortion
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(1.0 - dot(centered, centered));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}

// Pixelate
vec2 pixelate(vec2 uv, float pixels) {
  return floor(uv * pixels) / pixels;
}

// Rotate UV for planet rotation
vec2 rotate(vec2 coord, float angle) {
  coord -= 0.5;
  coord *= mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  coord += 0.5;
  return coord;
}

// Dithering
bool dither(vec2 uv, vec2 pixel_size, float value) {
  return mod(uv.x + uv.y, 2.0 * pixel_size.x) <= pixel_size.x == (value < 0.5);
}
`;
```

Each planet shader file then prepends this common code:

```typescript
import { COMMON_SHADER_FUNCTIONS } from './common.glsl';

export const RIVERS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// Uniforms
uniform float u_time;
uniform float u_seed;
uniform float u_pixels;
uniform float u_size;
uniform vec2 u_light_origin;
uniform vec4 u_colors[4];     // color palette
uniform float u_river_cutoff;
// ... other planet-specific uniforms

${COMMON_SHADER_FUNCTIONS}

void main() {
  // ... planet-specific rendering logic ported from Godot
}
`;
```

### Porting strategy

For each planet type:

1. Open the original Godot `.shader` file from Deep-Fold/PixelPlanets
2. Also reference the corresponding file in Timur310/PixelPlanets (JS port) for how uniforms were mapped
3. Copy the fragment logic, translate Godot-isms to WebGL2 GLSL using the table above
4. Prepend the common functions
5. Test by rendering a single planet and visually verifying it looks correct

**Do NOT attempt to port all 8 planet types at once.** Port Rivers first, get it rendering and looking correct, then do the rest. Rivers is the most complex (multiple layers: water, land, clouds) so if it works, the others will be easier.

---

## Step 3: Planet Type Definitions

Create `src/planets/PlanetTypes.ts`:

```typescript
interface PlanetTypeConfig {
  id: string;
  name: string;
  shaderKey: string;               // maps to which fragment shader to use
  baseColors: number[][];           // array of RGBA color palettes (each is [r,g,b,a] 0-1)
  uniforms: Record<string, number>; // planet-specific uniform defaults
  minRadius: number;                // game radius range this type appears at
  maxRadius: number;
  rarity: number;                   // weight for random selection (higher = more common)
}

const PLANET_TYPES: PlanetTypeConfig[] = [
  {
    id: 'rivers',
    name: 'Terran',
    shaderKey: 'rivers',
    baseColors: [
      [0.133, 0.212, 0.459, 1],  // deep ocean
      [0.188, 0.322, 0.565, 1],  // shallow water
      [0.235, 0.467, 0.267, 1],  // lowland
      [0.31, 0.537, 0.29, 1],    // highland
    ],
    uniforms: {
      river_cutoff: 0.45,
      octaves: 6,
    },
    minRadius: 40,
    maxRadius: 52,
    rarity: 2,
  },
  // ... define all planet types
];
```

### Planet type assignment

When a map is generated, each planet should be deterministically assigned a planet type based on its ID (so the same map seed always produces the same planet visuals). Use something like:

```typescript
function assignPlanetType(planetId: PlanetId, planetRadius: number, seed: number): PlanetTypeConfig {
  // Filter types by radius range
  const eligible = PLANET_TYPES.filter(t => planetRadius >= t.minRadius && planetRadius <= t.maxRadius);
  // Use deterministic pseudo-random based on planet ID + seed
  const hash = hashCombine(planetId, seed);
  const totalWeight = eligible.reduce((sum, t) => sum + t.rarity, 0);
  let pick = (hash % 1000) / 1000 * totalWeight;
  for (const type of eligible) {
    pick -= type.rarity;
    if (pick <= 0) return type;
  }
  return eligible[eligible.length - 1];
}
```

**Special cases:**
- Player home planet (id 0): Always assign a visually striking type like Rivers or LandMasses
- Enemy home planet (id 1): Always assign a visually aggressive type like LavaWorld
- Neutral planets: Random from eligible types based on radius

### Color palette variation

Each planet type has a base color palette, but individual planets should vary. Apply a deterministic hue/saturation shift per planet based on its ID:

```typescript
function varyColors(baseColors: number[][], planetId: PlanetId): number[][] {
  const shift = seededRandom(planetId) * 0.15 - 0.075; // ±7.5% hue shift
  return baseColors.map(c => applyHueShift(c, shift));
}
```

This means two Rivers planets won't look identical.

---

## Step 4: Planet Texture Cache

Create `src/planets/PlanetTextureCache.ts`:

```typescript
class PlanetTextureCache {
  private cache: Map<PlanetId, PlanetTexture>;

  /** Pre-render all planet textures for the current game state. */
  async generateAll(
    planets: ReadonlyArray<Planet>,
    renderer: WebGLShaderRenderer,
    seed: number
  ): Promise<void>;

  /** Get the cached texture for a planet. */
  get(planetId: PlanetId): PlanetTexture | null;

  /** Clear all cached textures (call on game reset). */
  clear(): void;
}

interface PlanetTexture {
  /** Static rendered planet image. */
  image: HTMLCanvasElement | ImageBitmap;

  /** Resolution the planet was rendered at. */
  resolution: number;

  /** Planet type info for reference. */
  typeId: string;
}
```

### Render resolution

Each planet should be rendered at a resolution proportional to its in-game radius, but pixelated to maintain the pixel-art aesthetic. A good formula:

```typescript
// The pixel planet shader itself handles pixelation via the u_pixels uniform.
// Render at 2x the visual pixel count for crispness, then draw scaled down.
const renderSize = Math.max(64, Math.ceil(planet.radius * 2.5));
// The u_pixels uniform controls the pixel-art grid size (e.g., 50-100 pixels across)
const pixelCount = Math.floor(renderSize * 0.8);
```

Small planets (radius 28-35): render at ~70px, u_pixels = 50
Medium planets (radius 36-44): render at ~100px, u_pixels = 70  
Large planets (radius 45-52): render at ~130px, u_pixels = 100

### Rotation animation (optional, nice-to-have)

For animated planet rotation, render N frames (e.g., 60) at init time with incrementing `u_time` values. Store as an array of images. During gameplay, cycle through frames based on game time.

```typescript
interface AnimatedPlanetTexture extends PlanetTexture {
  frames: (HTMLCanvasElement | ImageBitmap)[];
  frameCount: number;
  currentFrame: number;
}
```

If this adds too much init time (14 planets × 60 frames = 840 shader renders), reduce to 30 frames or skip animation entirely for the MVP and just render one static frame per planet. Static planets still look great — the lighting and noise give them depth.

**Recommended approach**: Render 1 static frame per planet for now. Add rotation animation later as a polish pass. The architecture supports it without changes.

---

## Step 5: Integrate into PlanetLayer

### Modified render order per planet

The `PlanetLayer.ts` render order changes from:

```
OLD:
1. Outer glow
2. Capture flash
3. Dark circle body          ← REPLACED
4. Inner specular gradient   ← REPLACED
5. Avatar silhouette inside  ← MOVED
6. Border ring
7. Selection ring
8. Production arc
9. Unit count
```

To:

```
NEW:
1. Outer glow                        (keep, but tint to planet's dominant color)
2. Capture flash                      (keep)
3. Procedural planet texture          ← NEW: ctx.drawImage of cached texture, clipped to circle
4. Border ring                        (keep)
5. Selection ring                     (keep)
6. Production arc                     (keep)
7. Unit count below planet            (keep)
8. Avatar badge ABOVE planet          ← MOVED from inside planet
```

### Drawing the planet texture

```typescript
// In PlanetLayer.ts, for each planet:
const texture = planetTextureCache.get(planet.id);
if (texture) {
  ctx.save();
  // Clip to circle
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.r * pulseScale, 0, Math.PI * 2);
  ctx.clip();
  // Draw the pre-rendered planet texture, centered and scaled
  const size = planet.r * 2 * pulseScale;
  ctx.drawImage(
    texture.image,
    planet.x - size / 2,
    planet.y - size / 2,
    size,
    size
  );
  ctx.restore();
}
```

### Glow color adaptation

The outer glow currently uses the owner color (cyan/red/gray). After this change, the glow should blend the owner color with the planet's dominant color for a more natural look. For neutral planets, use the planet's own dominant color with no owner tint.

Extract the dominant color from the planet type's color palette (first or brightest color) and use it as the glow base, then tint toward the owner color when owned:

```typescript
const planetColor = getPlanetDominantColor(planet.id); // from PlanetTypes
const ownerColor = ownerColors(planet.owner);
const glowColor = planet.owner === -1
  ? planetColor
  : lerpColor(planetColor, ownerColor.main, 0.5);
```

---

## Step 6: Avatar Badge Above Planet

### Design

When a planet is owned by a player (or bot), show a small circular avatar badge floating above the planet. This replaces the old "avatar inside the planet" approach.

**Layout:**

```
      ┌─────┐
      │avatar│    ← Small circle (16-22px radius), positioned above planet
      └─────┘
         │        ← Thin line connecting avatar to planet (optional)
     ┌───────┐
     │       │
     │ PLANET│    ← The procedural pixel planet
     │       │
     └───────┘
      [ 42 ]      ← Unit count below
```

### Implementation

```typescript
// Avatar badge position
const avatarRadius = Math.max(12, planet.r * 0.3);     // scale with planet size
const avatarY = planet.y - planet.r - avatarRadius - 8; // 8px padding above planet edge
const avatarX = planet.x;

// Connection line (subtle)
ctx.strokeStyle = ownerColor.main;
ctx.globalAlpha = 0.3;
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(planet.x, planet.y - planet.r);
ctx.lineTo(avatarX, avatarY + avatarRadius);
ctx.stroke();
ctx.globalAlpha = 1;

// Avatar circle background
ctx.fillStyle = ownerColor.dark;
ctx.beginPath();
ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
ctx.fill();

// Avatar border
ctx.strokeStyle = ownerColor.main;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
ctx.stroke();

// Avatar placeholder silhouette (same as before, just smaller)
// In multiplayer, this becomes: ctx.drawImage(discordAvatar, ...)
ctx.fillStyle = ownerColor.main;
ctx.globalAlpha = 0.4;
const iconR = avatarRadius * 0.55;
ctx.beginPath();
ctx.arc(avatarX, avatarY - iconR * 0.2, iconR * 0.4, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(avatarX, avatarY + iconR * 0.45, iconR * 0.6, Math.PI, 0);
ctx.fill();
ctx.globalAlpha = 1;
```

### Neutral planets

Neutral planets have NO avatar badge. The badge only appears on owned planets. This keeps the visual clean and makes ownership immediately obvious at a glance.

### Capture transition

When a planet is captured:
1. The old owner's avatar badge fades out (opacity → 0 over 200ms)
2. The new owner's avatar badge fades in (opacity 0 → 1 over 200ms)
3. These timings align with the existing capture flash effect

Track this in the planet's visual state:

```typescript
interface PlanetVisuals {
  // ... existing pulse, captureFlash
  avatarFadeIn: number;   // 0 to 1, increases when newly captured
  avatarFadeOut: number;  // 1 to 0, decreases for previous owner
  previousOwner: PlayerId | null; // needed to know which color to fade out
}
```

---

## Step 7: Loading State

Planet texture generation takes a moment (14 shader compiles + renders). Handle this gracefully.

### Init sequence

```
1. Show menu screen (instant)
2. User clicks PLAY
3. Show brief "Generating planets..." text or a loading bar on the canvas
4. PlanetTextureGenerator.generateAll() runs (should be < 500ms for 14 planets)
5. Once complete, start the game loop
```

### Fallback

If WebGL2 is not available (very rare in 2025), fall back to the existing flat-circle planet rendering. The game should still be fully playable — it just looks simpler.

```typescript
const webglAvailable = (() => {
  try {
    const testCanvas = document.createElement('canvas');
    return !!testCanvas.getContext('webgl2');
  } catch {
    return false;
  }
})();
```

If `webglAvailable` is false, skip the entire planet texture pipeline and render the old way.

---

## Step 8: Shader Porting — Detailed Guide for One Planet Type

Here is a detailed walkthrough for porting the **Rivers** planet type. Use this as the template for all other types.

### What the Rivers shader does (from the Godot source)

The Rivers planet has 3 visual layers rendered in one shader pass:

1. **Water layer**: Base ocean with two-tone coloring based on noise depth
2. **Land layer**: Continents using noise with a land cutoff threshold. Multiple colors based on elevation (low, mid, high).
3. **River layer**: Carves rivers into the land using a different noise pattern with a river cutoff threshold.

Light and shadow are applied across all layers. A dither pattern softens color transitions for the pixel-art aesthetic.

### Fragment shader structure

```glsl
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// Common uniforms
uniform float u_time;
uniform float u_seed;
uniform float u_pixels;       // pixel grid size (e.g. 50.0)
uniform float u_size;         // size for noise tiling
uniform vec2 u_light_origin;  // light direction (0-1 range, default 0.39, 0.39)
uniform float u_time_speed;   // rotation speed
uniform int u_octaves;        // fbm octaves

// Planet-specific uniforms
uniform float u_river_cutoff;
uniform float u_land_cutoff;
uniform float u_light_border1;
uniform float u_light_border2;

// Color palette (pass as individual vec4s or as array)
uniform vec4 u_color_water_deep;
uniform vec4 u_color_water_shallow;
uniform vec4 u_color_land_low;
uniform vec4 u_color_land_mid;
uniform vec4 u_color_land_high;

// ... paste COMMON_SHADER_FUNCTIONS here ...

void main() {
  // 1. Pixelate UVs
  vec2 uv = v_uv;
  uv = pixelate(uv, u_pixels);

  // 2. Check circle mask (discard outside planet circle)
  float d_circle = distance(uv, vec2(0.5));
  if (d_circle > 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  // 3. Spherify
  vec2 sphere_uv = spherify(uv);

  // 4. Apply rotation (scroll UV based on time)
  float t = u_time * u_time_speed;
  vec2 map_uv = rotate(sphere_uv, t);

  // 5. Generate terrain noise
  float terrain = fbm(map_uv * u_size + vec2(u_seed, u_seed), u_octaves);

  // 6. Generate river noise (different seed offset)
  float rivers = fbm(map_uv * u_size + vec2(u_seed + 40.0, u_seed + 40.0), u_octaves);

  // 7. Lighting
  float light_d = distance(uv, u_light_origin);
  float light = smoothstep(u_light_border1, u_light_border2, light_d);

  // 8. Color mapping
  vec3 color;
  float alpha = 1.0;

  if (terrain < u_land_cutoff) {
    // Water
    color = terrain < u_land_cutoff * 0.5
      ? u_color_water_deep.rgb
      : u_color_water_shallow.rgb;
  } else {
    // Land
    if (rivers < u_river_cutoff) {
      // River (water color on land)
      color = u_color_water_shallow.rgb;
    } else {
      // Land coloring by elevation
      float elevation = (terrain - u_land_cutoff) / (1.0 - u_land_cutoff);
      if (elevation < 0.33) {
        color = u_color_land_low.rgb;
      } else if (elevation < 0.66) {
        color = u_color_land_mid.rgb;
      } else {
        color = u_color_land_high.rgb;
      }
    }
  }

  // 9. Apply lighting (darken shadow side)
  color = mix(color, color * 0.5, light);

  // 10. Output
  fragColor = vec4(color, alpha);
}
```

**NOTE**: The above is a simplified reference. The actual Godot shader will have more nuance (dithering at color boundaries, multiple noise layers for clouds, light distance falloff curves, etc.). Port the full logic from the original, not this simplified version. Use this as a structural guide only.

### Testing individual shaders

After porting each shader, test it by rendering it to a visible canvas element temporarily:

```typescript
// Temporary test: render one planet and show it
const renderer = new WebGLShaderRenderer(200, 200);
const program = renderer.compileShader(RIVERS_FRAGMENT_SHADER);
renderer.render(program, {
  u_time: { type: '1f', value: 0 },
  u_seed: { type: '1f', value: 42 },
  u_pixels: { type: '1f', value: 80 },
  u_size: { type: '1f', value: 4 },
  u_light_origin: { type: '2f', value: [0.39, 0.39] },
  // ... etc
});
document.body.appendChild(renderer.canvas); // temporary, remove after testing
```

Compare against the original at https://deep-fold.itch.io/pixel-planet-generator

---

## Acceptance Criteria

### Must have
- [ ] WebGL2 shader renderer compiles and runs fragment shaders on an offscreen canvas
- [ ] At least 5 planet types ported and rendering correctly (Rivers, LandMasses, DryTerran, IceWorld, LavaWorld are the priority)
- [ ] Planet textures pre-rendered at game init and cached
- [ ] PlanetLayer draws cached textures clipped to planet circles
- [ ] Owner avatar badges render above owned planets with connection line
- [ ] Neutral planets show no avatar badge
- [ ] Existing rings, glow, selection, production arc, unit count all still render correctly
- [ ] Capture flash and screen shake still work
- [ ] Player home planet always gets an Earth-like type (Rivers/LandMasses)
- [ ] Enemy home planet always gets an aggressive type (LavaWorld/DryTerran)
- [ ] WebGL fallback: game still works (flat circles) if WebGL2 is unavailable
- [ ] Build passes with no type errors
- [ ] No visible performance regression (still 60fps)

### Nice to have
- [ ] All 8 planet types ported
- [ ] Planet rotation animation (pre-rendered frames)
- [ ] Color palette variation per planet (hue shift)
- [ ] Loading indicator during planet generation
- [ ] Smooth avatar badge fade-in/fade-out on capture
- [ ] Glow color adapts to planet's dominant color

### Do NOT
- [ ] Do not add Three.js
- [ ] Do not change game logic, engine, AI, or input
- [ ] Do not change the main game canvas from 2D to WebGL — the game canvas stays Canvas2D
- [ ] Do not make planets 3D — they are flat pixel-art planets rendered by a fragment shader

---

## Testing

### Manual verification
- Start a game. All planets should show procedural pixel-art textures instead of flat circles.
- Capture a planet. The old owner's avatar should fade, the new owner's avatar should appear above.
- Verify no visual glitches at planet edges (clipping should be clean circles).
- Verify performance: open Chrome DevTools → Performance tab → record 10 seconds of gameplay. Frame time should be consistent <16ms.
- Resize the browser window. Planets should still render correctly.
- Test in Firefox and Chrome at minimum.

### Automated
- `WebGLShaderRenderer.test.ts`: Test that the renderer initializes without throwing, compiles a trivial shader, and produces a non-empty canvas.
- `PlanetTextureCache.test.ts`: Test that generateAll populates the cache for all planet IDs, and that get() returns textures.
- `PlanetTypes.test.ts`: Test that assignPlanetType is deterministic (same ID + seed = same type) and respects radius constraints.

---

## Build and verify

```bash
npx tsc --noEmit
npm run build
npm test
```

All must pass. When complete, create `prompts/PHASE_1_5_SUMMARY.md` documenting what was built, what shaders were ported, any deviations from this spec, and visual screenshots if possible.
