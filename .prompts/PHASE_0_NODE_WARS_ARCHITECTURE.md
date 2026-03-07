NOTES: THIS WAS RENDERED ASSUMING REACT BY CLAUDE. WE ARE USING VANILLA TYPESCRIPT (with any frameworks you feel will help)
I DID A QUICK FIND AND REPLACE ON REACT WITH TYPESCRIPT SO SOME STUFF MAY NOT MAKE SENSE HOPE YOU CAN FIGURE IT OUT. CLAUDE SAYS YOU CAN

# Node Wars — Architecture & Refactoring Specification

## Context

You are refactoring a working Galcon-style real-time strategy game from a single monolithic Typescript component (`downloads/game.tsx`) into a professional, modular, production-grade codebase. The game is called **Node Wars** and is being built as a **Discord Activity** (embedded web app via Discord's Embedded App SDK).

The existing file is a fully functional MVP with canvas rendering, bot AI, particle effects, UI overlays, and game loop. Your job is to decompose it into a clean architecture while preserving every feature and visual behavior. **The game must remain fully playable and visually identical after refactoring.**

---

## Project Setup

### Tech Stack

- **Framework**: Typescript (with any frameworks you feel help in our goal)
- **Build**: Vite
- **Rendering**: HTML5 Canvas 2D (no WebGL for now — keep it lightweight)
- **State**: Zustand for UI/app state, plain TypeScript classes for game engine state
- **Testing**: Vitest + Typescript Testing Library + @testing-library/user-event
- **Linting**: ESLint with typescript-eslint, Prettier
- **Styling**: CSS Modules for UI overlays, canvas handles its own rendering

### Initialize the Project

```bash
npm create vite@latest node-wars -- --template Typescript-ts
cd node-wars
npm install zustand
npm install -D vitest @testing-library/Typescript @testing-library/jest-dom @testing-library/user-event jsdom eslint prettier
```

Configure `tsconfig.json` with:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Configure Vite path aliases to match.

---

## Directory Structure

```
src/
├── main.tsx                          # Entry point
├── App.tsx                           # Root component, screen router
├── constants/
│   ├── game.ts                       # Gameplay tuning constants
│   ├── visual.ts                     # Colors, sizes, particle settings
│   └── ai.ts                         # AI tuning constants
├── types/
│   ├── game.ts                       # Planet, Fleet, Player, GameState
│   ├── visual.ts                     # Particle, Trail, Star, Nebula
│   ├── input.ts                      # InputEvent, DragState
│   └── ai.ts                         # AIDecision, AIContext
├── engine/
│   ├── GameEngine.ts                 # Main engine class — owns the loop, tick, state
│   ├── systems/
│   │   ├── ProductionSystem.ts       # Unit production per tick
│   │   ├── FleetSystem.ts            # Fleet movement, arrival, combat resolution
│   │   ├── ParticleSystem.ts         # Particle and trail lifecycle
│   │   └── CombatResolver.ts        # Pure function: resolve fleet vs planet
│   ├── ai/
│   │   ├── BotAI.ts                  # AI decision-making (current logic)
│   │   ├── AIPersonality.ts          # Difficulty profiles (passive, balanced, aggressive)
│   │   └── ThreatAnalyzer.ts         # Incoming fleet threat assessment
│   ├── map/
│   │   ├── MapGenerator.ts           # Planet placement with constraint solving
│   │   └── MapValidator.ts           # Fairness checks (distance symmetry, etc.)
│   └── actions/
│       └── FleetDispatcher.ts        # Send fleet action — validates and mutates state
├── renderer/
│   ├── CanvasRenderer.ts             # Main renderer — orchestrates all draw calls
│   ├── layers/
│   │   ├── BackgroundLayer.ts        # Stars, nebulae, grid
│   │   ├── PlanetLayer.ts            # Planet rendering (glow, body, ring, avatar, HUD)
│   │   ├── FleetLayer.ts             # Fleet rendering (glow, core, unit count)
│   │   ├── ParticleLayer.ts          # Particles and trails
│   │   ├── SelectionLayer.ts         # Drag line, selection ring, hover states
│   │   └── HUDLayer.ts              # Top bar stats
│   └── effects/
│       ├── ScreenShake.ts            # Shake state and transform
│       ├── CaptureFlash.ts           # Flash-on-capture effect
│       └── PulseEffect.ts           # Planet pulse animation
├── input/
│   ├── InputManager.ts               # Mouse/touch → game actions (planet select, drag, release)
│   └── InputMapper.ts                # Raw DOM events → normalized InputEvents
├── ui/
│   ├── screens/
│   │   ├── MenuScreen.tsx            # Main menu
│   │   ├── HelpScreen.tsx            # How to play
│   │   ├── VictoryScreen.tsx         # Win screen
│   │   ├── DefeatScreen.tsx          # Lose screen
│   │   └── GameScreen.tsx            # Canvas + in-game UI wrapper
│   ├── components/
│   │   ├── GameCanvas.tsx            # Canvas element + resize + engine lifecycle
│   │   ├── ActionButton.tsx          # Reusable styled button
│   │   ├── ScreenOverlay.tsx         # Overlay wrapper (backdrop, center, animate)
│   │   └── StatBar.tsx               # Top HUD stats (alternative: render on canvas)
│   ├── styles/
│   │   ├── global.css                # Reset, CSS variables, fonts
│   │   ├── menu.module.css
│   │   ├── help.module.css
│   │   ├── overlay.module.css
│   │   └── buttons.module.css
│   └── store/
│       └── useGameStore.ts           # Zustand store for UI state (screen, settings)
├── audio/
│   ├── AudioManager.ts               # Placeholder — Web Audio API hooks
│   └── SoundEffects.ts               # Enum + trigger map for future SFX
├── discord/
│   ├── DiscordSDK.ts                 # Discord Embedded App SDK wrapper
│   ├── AvatarProvider.ts             # Fetch + cache Discord user avatars as Image objects
│   └── PresenceManager.ts            # Activity presence updates
├── multiplayer/
│   ├── NetworkManager.ts             # Placeholder — WebSocket or Discord RPC sync
│   ├── StateSync.ts                  # Placeholder — state diffing and reconciliation
│   └── LobbyManager.ts              # Placeholder — room creation, player join/leave
├── utils/
│   ├── math.ts                       # dist, lerp, clamp, rand, randInt, angle
│   ├── canvas.ts                     # Canvas helpers (resize, DPI scaling)
│   └── color.ts                      # Color manipulation if needed
└── __tests__/
    ├── engine/
    │   ├── CombatResolver.test.ts
    │   ├── ProductionSystem.test.ts
    │   ├── FleetSystem.test.ts
    │   └── MapGenerator.test.ts
    ├── ai/
    │   ├── BotAI.test.ts
    │   └── ThreatAnalyzer.test.ts
    ├── input/
    │   └── InputManager.test.ts
    └── ui/
        ├── MenuScreen.test.tsx
        └── GameCanvas.test.tsx
```

---

## Architecture Principles

### 1. Separation of Concerns

The game has three distinct layers. They must not bleed into each other.

| Layer | Responsibility | Knows About |
|-------|---------------|-------------|
| **Engine** | Game state, simulation, physics, AI | Types only. No DOM, no Typescript, no canvas. |
| **Renderer** | Drawing to canvas | Engine state (read-only). No mutation. |
| **UI** | Typescript overlays, menus, lifecycle | Zustand store. Talks to engine via thin API. |

**Critical rule**: The engine must be renderable by ANY renderer. If you swapped the canvas renderer for a terminal renderer printing ASCII, the engine should not care. This means:

- Engine classes never import from `renderer/` or `ui/`.
- Engine never calls `requestAnimationFrame` directly — the game loop host (GameCanvas component) drives the tick.
- Engine exposes a `getState(): Readonly<GameState>` method the renderer reads from each frame.

### 2. Pure Logic Where Possible

Combat resolution, production calculation, AI scoring — these should all be **pure functions** with deterministic outputs for given inputs. This makes them trivially testable.

```typescript
// GOOD — pure, testable
function resolveCombat(attackerUnits: number, defenderUnits: number, defenderOwner: PlayerId): CombatResult {
  const remaining = defenderUnits - attackerUnits;
  if (remaining < 0) {
    return { captured: true, remainingUnits: Math.abs(remaining) };
  }
  return { captured: false, remainingUnits: remaining };
}

// BAD — mutates state, untestable without full setup
function resolveCombat(fleet: Fleet, planet: Planet): void {
  planet.units -= fleet.units;
  if (planet.units < 0) { planet.owner = fleet.owner; ... }
}
```

Prefer the pure version. The calling system (FleetSystem) handles the mutation.

### 3. Data-Oriented Game State

Game state is a plain serializable object. No class instances with methods embedded in state. This is critical for future multiplayer (state must be serializable for network sync).

```typescript
interface GameState {
  planets: Planet[];
  fleets: Fleet[];
  players: Player[];
  time: number;
  status: 'playing' | 'victory' | 'defeat';
  winner: PlayerId | null;
}

interface Planet {
  id: PlanetId;
  x: number;
  y: number;
  radius: number;
  owner: PlayerId | null;   // null = neutral
  units: number;
  maxUnits: number;
  productionRate: number;
}
```

Use branded types for IDs to prevent mixing them up:

```typescript
type PlanetId = number & { readonly __brand: 'PlanetId' };
type PlayerId = number & { readonly __brand: 'PlayerId' };
type FleetId = number & { readonly __brand: 'FleetId' };
```

### 4. Visual State Separate from Game State

Particles, trails, screen shake, pulse animations, hover state — these are **visual-only state**. They must not exist in the game state object. The renderer owns them.

```typescript
// Renderer-owned visual state
interface VisualState {
  particles: Particle[];
  trails: Trail[];
  stars: Star[];
  nebulae: Nebula[];
  screenShake: { timeRemaining: number; intensity: number };
  planetVisuals: Map<PlanetId, { pulse: number; captureFlash: number }>;
}
```

This means if you serialize GameState for multiplayer, you get only the gameplay-relevant data. Each client generates its own particles.

---

## Module Contracts

### GameEngine

```typescript
class GameEngine {
  private state: GameState;
  private systems: GameSystem[];
  private aiControllers: Map<PlayerId, BotAI>;
  private nextFleetId: number;

  constructor(config: GameConfig) { ... }

  /** Advance simulation by dt (in seconds). Called by external loop host. */
  tick(dt: number): void;

  /** Read-only snapshot of current state. */
  getState(): Readonly<GameState>;

  /** Player action: send fleet from one planet to another. */
  dispatchFleet(fromId: PlanetId, toId: PlanetId, owner: PlayerId): FleetDispatchResult;

  /** Subscribe to game events (capture, combat, victory, defeat). */
  on(event: GameEvent, callback: GameEventCallback): void;

  /** Reset to a new game with fresh map. */
  reset(config?: Partial<GameConfig>): void;
}
```

The engine emits events that the renderer listens to for triggering visual effects:

```typescript
type GameEvent =
  | { type: 'fleet_launched'; fleet: Fleet; from: Planet }
  | { type: 'fleet_arrived'; fleet: Fleet; target: Planet; result: CombatResult }
  | { type: 'planet_captured'; planet: Planet; newOwner: PlayerId; previousOwner: PlayerId | null }
  | { type: 'game_over'; winner: PlayerId };
```

### CanvasRenderer

```typescript
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private visualState: VisualState;
  private layers: RenderLayer[];

  constructor(canvas: HTMLCanvasElement) { ... }

  /** Render one frame using current game state. */
  render(gameState: Readonly<GameState>, dt: number): void;

  /** Handle game events to spawn visual effects. */
  handleEvent(event: GameEvent): void;

  /** Resize canvas and recalculate. */
  resize(width: number, height: number): void;

  /** Cleanup. */
  destroy(): void;
}
```

### InputManager

```typescript
class InputManager {
  private canvas: HTMLCanvasElement;
  private onFleetDispatch: (from: PlanetId, to: PlanetId) => void;

  constructor(canvas: HTMLCanvasElement, callbacks: InputCallbacks) { ... }

  /** Returns current drag state for the renderer to draw the selection line. */
  getDragState(): DragState | null;

  /** Returns currently hovered planet for highlight rendering. */
  getHoverPlanetId(): PlanetId | null;

  /** Attach DOM listeners. */
  attach(): void;

  /** Detach DOM listeners. */
  detach(): void;
}
```

The InputManager needs access to current planet positions to do hit-testing. Pass it a getter:

```typescript
type PlanetHitTestFn = (screenPos: Vec2) => Planet | null;
```

---

## Rendering Architecture

### Layer System

Each layer is a class implementing:

```typescript
interface RenderLayer {
  render(ctx: CanvasRenderingContext2D, state: RenderContext): void;
}

interface RenderContext {
  gameState: Readonly<GameState>;
  visualState: VisualState;
  dragState: DragState | null;
  hoverPlanetId: PlanetId | null;
  canvasWidth: number;
  canvasHeight: number;
  time: number;
  dt: number;
}
```

Layers render in order:
1. BackgroundLayer (stars, nebulae, grid)
2. SelectionLayer (drag line)
3. ParticleLayer (trails — behind fleets)
4. FleetLayer
5. PlanetLayer (glow, body, avatar placeholder, ring, unit count)
6. ParticleLayer (explosion particles — above planets)
7. HUDLayer

Note: ParticleLayer renders in two passes — trails behind, explosions above. Implement this as two method calls or two separate layer instances with different particle sets.

### Planet Rendering — Avatar-Ready Design

Each planet is drawn as a clipped circle specifically designed to accept a Discord avatar image. The render order per planet:

1. Outer glow (radial gradient, pulsing)
2. Capture flash (if active)
3. Dark circle body (this becomes the avatar mask area)
4. Inner specular gradient (subtle glass effect)
5. **Avatar image** (drawn with `ctx.clip()` into the circle) — currently a silhouette placeholder
6. Border ring (color = owner, thickness varies with selection/hover)
7. Selection outer ring (if selected, animated opacity)
8. Production capacity arc (partial ring showing units/maxUnits)
9. Unit count text (below the planet)

When Discord avatars are available, step 5 switches from the placeholder silhouette to:
```typescript
ctx.save();
ctx.beginPath();
ctx.arc(planet.x, planet.y, planet.radius * pulseScale, 0, Math.PI * 2);
ctx.clip();
ctx.drawImage(avatarImage, planet.x - planet.radius, planet.y - planet.radius, planet.radius * 2, planet.radius * 2);
ctx.restore();
```

The AvatarProvider class pre-loads Discord avatar URLs into `HTMLImageElement` objects and caches them by user ID.

---

## AI System

### Architecture

```typescript
class BotAI {
  private personality: AIPersonality;
  private threatAnalyzer: ThreatAnalyzer;
  private timer: number;

  constructor(playerId: PlayerId, personality: AIPersonality) { ... }

  /** Called every engine tick. Returns action if ready. */
  evaluate(state: Readonly<GameState>, dt: number): AIDecision | null;
}

interface AIPersonality {
  name: string;
  decisionInterval: number;        // ms between decisions
  aggression: number;               // 0-1, bias toward attacking player vs neutral
  expansionism: number;             // 0-1, bias toward grabbing neutral planets
  caution: number;                  // 0-1, how much to hold back for defense
  minimumSendThreshold: number;     // don't send unless we have at least this many
  overpowerRatio: number;           // desired attackers / defenders ratio
}
```

### Difficulty Presets

```typescript
const AI_PERSONALITIES = {
  passive: {
    name: 'Passive',
    decisionInterval: 2500,
    aggression: 0.2,
    expansionism: 0.8,
    caution: 0.6,
    minimumSendThreshold: 8,
    overpowerRatio: 1.8,
  },
  balanced: {
    name: 'Balanced',
    decisionInterval: 1800,
    aggression: 0.5,
    expansionism: 0.5,
    caution: 0.4,
    minimumSendThreshold: 5,
    overpowerRatio: 1.3,
  },
  aggressive: {
    name: 'Aggressive',
    decisionInterval: 1200,
    aggression: 0.8,
    expansionism: 0.3,
    caution: 0.2,
    minimumSendThreshold: 3,
    overpowerRatio: 1.0,
  },
} as const;
```

### Threat Analyzer

Extracted as its own module because it will be reused for multiplayer and for the renderer (to show threat indicators later).

```typescript
class ThreatAnalyzer {
  /** Returns total incoming hostile units to a given planet. */
  getIncomingThreats(planetId: PlanetId, state: Readonly<GameState>, forPlayer: PlayerId): number;

  /** Returns planets most at risk for a given player. */
  getVulnerablePlanets(state: Readonly<GameState>, forPlayer: PlayerId): PlanetThreatAssessment[];
}
```

---

## Map Generation

### Requirements

- **Mirror fairness**: Player and enemy home planets must be equidistant from center with roughly symmetric access to neutral planets.
- **Minimum spacing**: No two planets within `minPlanetSpacing` of each other (currently `planet.r + other.r + 50`).
- **Edge padding**: All planets at least `edgePadding` from canvas edges.
- **Variety**: Randomized planet sizes (which affect production rate and capacity).
- **Configurable**: Planet count, canvas dimensions, min/max radius all parameterized.

### Validation

After generating a map, run a validation pass:

```typescript
interface MapValidation {
  isValid: boolean;
  issues: string[];
}

function validateMap(planets: Planet[], config: MapConfig): MapValidation;
```

Check for:
- Both home planets present and correctly owned
- No overlapping planets
- All planets within bounds
- Rough distance-symmetry between home planets and nearest neutrals
- Minimum of N neutral planets generated (retry if too few placed due to collision constraints)

---

## State Management

### Zustand Store (UI State Only)

```typescript
interface UIState {
  screen: 'menu' | 'playing' | 'help' | 'victory' | 'defeat';
  difficulty: 'passive' | 'balanced' | 'aggressive';
  winner: PlayerId | null;
  setScreen: (screen: UIState['screen']) => void;
  setDifficulty: (d: UIState['difficulty']) => void;
  startGame: () => void;
}
```

This store handles ONLY UI navigation. Game simulation state lives in the engine and is never duplicated into Zustand.

---

## Component Hierarchy

```
App
├── MenuScreen          (screen === 'menu')
├── HelpScreen          (screen === 'help')
├── GameScreen          (screen === 'playing')
│   ├── GameCanvas      (owns engine, renderer, input lifecycle)
│   └── InGameHelpBtn
├── VictoryScreen       (screen === 'victory')
└── DefeatScreen        (screen === 'defeat')
```

### GameCanvas — The Critical Glue Component

This is the most important Typescript component. It bridges Typescript's lifecycle with the imperative game loop.

```typescript
function GameCanvas({ difficulty }: { difficulty: Difficulty }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  useEffect(() => {
    // 1. Create engine with config
    // 2. Create renderer attached to canvas
    // 3. Create input manager attached to canvas
    // 4. Wire engine events → renderer.handleEvent
    // 5. Wire input dispatch → engine.dispatchFleet
    // 6. Start animation loop: each frame calls engine.tick(dt), then renderer.render(state, dt)
    // 7. Return cleanup that stops loop, detaches input, destroys renderer
  }, [difficulty]);

  useEffect(() => {
    // Handle resize: update canvas dimensions, notify renderer
    // Use ResizeObserver on canvas parent, not window resize
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
```

**Critical**: Use `ResizeObserver` instead of `window.resize` for the canvas container. Set `canvas.width` and `canvas.height` to the container's `clientWidth` and `clientHeight` (or multiply by `devicePixelRatio` for crisp rendering on high-DPI displays, then scale the context).

---

## Testing Strategy

### What to Test

| Module | Test Type | What to Assert |
|--------|-----------|----------------|
| CombatResolver | Unit | Capture when attackers > defenders, no capture otherwise, exact unit math |
| ProductionSystem | Unit | Units increment correctly per tick, respect maxUnits cap, only for owned planets |
| FleetSystem | Unit | Fleet position advances by speed * dt, arrival triggers combat, removal after arrival |
| MapGenerator | Unit | Correct planet count, no overlaps, homes correctly owned, all within bounds |
| BotAI | Unit | Makes decisions at correct intervals, respects personality params, doesn't send from empty planets |
| ThreatAnalyzer | Unit | Correctly sums incoming hostile fleets, identifies correct vulnerable planets |
| FleetDispatcher | Unit | Validates ownership, calculates correct send amount, rejects invalid dispatches |
| InputManager | Integration | Mousedown on owned planet → selection, drag + release on target → dispatch callback, release on empty → cancel |
| GameEngine | Integration | Full tick cycle produces correct state transitions, game over conditions trigger correctly |
| MenuScreen | Component | Renders buttons, play button calls startGame, help button navigates |
| GameCanvas | Component | Mounts canvas, cleans up on unmount |

### Test Patterns

```typescript
// Pure function test
describe('CombatResolver', () => {
  it('captures planet when attackers exceed defenders', () => {
    const result = resolveCombat(20, 15);
    expect(result.captured).toBe(true);
    expect(result.remainingUnits).toBe(5);
  });

  it('does not capture when defenders hold', () => {
    const result = resolveCombat(10, 15);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(5);
  });

  it('captures with zero remaining on exact match', () => {
    const result = resolveCombat(15, 15);
    // Design decision: exact tie = capture with 0 units, or no capture?
    // Choose one and document it. I recommend: tie = no capture (defenders advantage).
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(0);
  });
});
```

### Testing Canvas Code

Don't unit-test the renderer pixel-by-pixel. Instead:
- Test that `render()` doesn't throw for various game states (empty, full, mid-game).
- Test that layer render methods are called with correct context.
- Snapshot test: render to an OffscreenCanvas and compare dimensions/non-blank output.

---

## UX Polish Checklist

### Game Feel

- [ ] Screen shake on planet capture (already present — preserve it)
- [ ] Capture flash (expanding ring, fading out)
- [ ] Fleet launch burst particles
- [ ] Fleet arrival impact particles (different for capture vs. combat vs. reinforcement)
- [ ] Pulsing planet border (subtle, owner-colored)
- [ ] Production capacity ring (arc that fills as units approach max)
- [ ] Smooth drag line with animated dash offset
- [ ] Hover highlight on planets (thicker border, slight scale)
- [ ] Unit counts with text shadow for readability

### UI/UX

- [ ] Menu has clear visual hierarchy: title > subtitle > buttons
- [ ] Help screen is scannable (icon + title + description per concept)
- [ ] Victory/defeat screens have distinct theming (cyan vs. red)
- [ ] In-game help accessible via a small unobtrusive button
- [ ] All buttons have hover states
- [ ] Consistent font family across all UI (Courier New / monospace for the cyber aesthetic)
- [ ] CSS transitions on all overlay visibility changes (fade in/out)
- [ ] Touch-friendly: all tap targets minimum 44x44px
- [ ] Canvas resizes cleanly without breaking game state
- [ ] No visible jank when switching between overlay screens

### Accessibility

- [ ] Sufficient color contrast between player (cyan) and enemy (red) — both on dark background
- [ ] Unit counts are always readable (text shadow / outline)
- [ ] UI overlays are keyboard-navigable (tab, enter)
- [ ] Focus trapping on modal overlays (help, victory, defeat screens)
- [ ] Reduced motion preference: check `prefers-reduced-motion` and tone down particles/shake

---

## Refactoring Steps — Execute in Order

Follow this exact sequence. After each step, verify the game still runs and plays correctly before moving to the next.

### Step 1: Project scaffold
Initialize the Vite project, install dependencies, configure TypeScript strict mode and path aliases. Copy the monolith into `downloads/game.tsx` if not already there.

### Step 2: Types
Create all type files first. Extract every interface and type from the monolith. Add branded ID types. This is the foundation everything else imports from.

### Step 3: Constants
Extract all magic numbers into `constants/`. Group them logically: gameplay tuning, visual/color config, AI config. Use `as const` objects.

### Step 4: Utils
Extract pure utility functions: `dist`, `lerp`, `clamp`, `rand`, `randInt`, `ownerColors`. Add proper TypeScript signatures.

### Step 5: Combat and production (pure functions)
Extract `CombatResolver` and production logic as pure functions. Write unit tests for both. This is the easiest win — zero dependencies, fully testable.

### Step 6: Map generator
Extract `MapGenerator` and `MapValidator`. Write tests for constraint satisfaction. Parameterize with `MapConfig`.

### Step 7: AI system
Extract `BotAI`, `AIPersonality` profiles, and `ThreatAnalyzer`. The AI should operate on `Readonly<GameState>` and return decisions — never mutate state directly. Write tests.

### Step 8: Engine core
Build `GameEngine` class. It owns the state and systems array. Implement `tick()`, `getState()`, `dispatchFleet()`, and the event emitter. The engine does NOT own the loop — it just advances state when told to.

### Step 9: Fleet system
Extract fleet movement, arrival detection, and combat triggering into `FleetSystem`. It reads fleet positions, advances them, checks for arrivals, and calls `CombatResolver`. It emits events through the engine's event system.

### Step 10: Production system
Extract `ProductionSystem`. Simple: iterate owned planets, increment units, cap at max.

### Step 11: Fleet dispatcher (action)
Extract the "send fleet" logic into `FleetDispatcher`. Validates ownership, calculates send amount, deducts from source planet, creates fleet object, returns result.

### Step 12: Renderer — layers
Build the `CanvasRenderer` with the layer system. Port all drawing code from the monolith into their respective layers. Each layer gets its own file with a single render method. Maintain visual parity with the monolith.

### Step 13: Visual state and effects
Create the `VisualState` structure owned by the renderer. Move particles, trails, screen shake, pulse, and capture flash into it. Wire engine events to spawn effects.

### Step 14: Input manager
Extract all mouse/touch handling into `InputManager`. It translates raw DOM events into game actions (select planet, drag, release/dispatch). Expose drag state and hover state for the renderer.

### Step 15: Typescript UI
Build the Zustand store. Create all screen components with CSS Modules. Build the `GameCanvas` component that bridges everything. Wire up the screen router in `App.tsx`.

### Step 16: Polish pass
- Add screen transitions (CSS opacity/transform on overlays)
- Verify DPI scaling (`devicePixelRatio`)
- Add `prefers-reduced-motion` checks
- Ensure touch works (test with Chrome DevTools mobile simulation)
- Performance check: profile with Chrome DevTools, ensure 60fps with max particles

### Step 17: Discord integration stubs
Create the `discord/` module with placeholder classes. These don't need to function yet, but the interfaces should be correct per the Discord Embedded App SDK documentation. The `AvatarProvider` should have a `getAvatar(userId: string): HTMLImageElement | null` API that the planet renderer can call.

### Step 18: Multiplayer stubs
Create `multiplayer/` module with placeholder network manager. Define the message protocol types even though nothing is connected yet. This forces you to think about what state needs to sync.

### Step 19: Audio stubs
Create `audio/` module with `AudioManager` that has a `play(effect: SoundEffect): void` API. Wire it to engine events but have it no-op for now. This makes adding sound later trivial.

### Step 20: Final test pass
Run all tests. Fix any failures. Ensure coverage on all pure logic modules. Do a manual playthrough on desktop and mobile viewport.

---

## Performance Budget

- **Target**: 60fps consistent on mid-range hardware
- **Particle cap**: 600 active particles, 1200 trails (already implemented)
- **Object pooling**: If GC pressure is noticeable, pool particle objects instead of creating/destroying. Not needed initially but design the `ParticleSystem` so pooling can be added without API changes.
- **Canvas operations**: Minimize state changes (`ctx.save()`/`ctx.restore()` are expensive in tight loops — batch draws of the same style).
- **Avoid per-frame allocations**: Don't create new objects in render loops. Reuse vectors, result objects, etc.

---

## Code Style

- All files use TypeScript strict mode.
- Prefer `const` over `let`. Never use `var`.
- No `any` types. Use `unknown` and narrow.
- All public methods have JSDoc comments.
- Private fields use `private` keyword (not `#`).
- One class per file. File name matches class name.
- Enum-like values use `as const` objects, not TypeScript `enum`.
- Typescript components are function components with explicit return types.
- CSS class names use camelCase in modules.
- Magic numbers are always in `constants/`. If you write a number literal in logic code, it belongs in a constant.

---

## Future Considerations (Don't Build, But Design Around)

These features are on the roadmap. The architecture should not block them:

1. **Multiplayer (2-6 players)**: State sync over WebSocket. Authoritative server. Client-side prediction.
2. **Discord Avatars**: Clipped into planet circles. Pre-loaded, cached.
3. **Cosmetics**: Planet skins, fleet trail effects, capture animations. Should be swappable in the renderer without touching engine.
4. **Sound**: Event-driven. Engine emits events, AudioManager plays corresponding sounds.
5. **Spectator mode**: Read-only game state subscription. Renderer works, input disabled.
6. **Map editor**: GUI for placing planets. Exports `MapConfig` that `MapGenerator` can use as a seed.
7. **Replay system**: Record timestamped actions, replay through engine. Possible because engine is deterministic given same inputs.
8. **Leaderboard**: Per-Discord-server stats. Needs player identity from Discord SDK.

---

## Quick Reference — What Goes Where

| I need to... | File |
|---|---|
| Change how fast planets produce units | `constants/game.ts` |
| Change the cyan/red color scheme | `constants/visual.ts` |
| Fix a combat math bug | `engine/systems/CombatResolver.ts` |
| Make the AI smarter | `engine/ai/BotAI.ts` + `ThreatAnalyzer.ts` |
| Add a new particle effect | `renderer/effects/` + listen to new engine event |
| Change how planets look | `renderer/layers/PlanetLayer.ts` |
| Add a new menu screen | `ui/screens/` + add route in `App.tsx` |
| Add Discord avatar support | `discord/AvatarProvider.ts` + `renderer/layers/PlanetLayer.ts` |
| Add a new game mechanic | Define in `types/`, implement in `engine/systems/`, render in `renderer/layers/` |
| Add keyboard shortcuts | `input/InputMapper.ts` + `InputManager.ts` |
| Add sound effects | `audio/SoundEffects.ts` + `AudioManager.ts` + wire to engine events |

---

## Final Notes

The monolith in `downloads/game.tsx` is the **ground truth** for behavior and visuals. If something looks or plays differently after refactoring, the refactor introduced a bug. Use the monolith as your visual reference at all times.

Every module should be independently importable and testable. If you can't write a test for a module without importing half the codebase, the module boundary is wrong.

Ship quality. This is a product, not a prototype.
