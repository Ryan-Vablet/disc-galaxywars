# PHASE 2.5 — Planet Balance, Sun Mechanic, and AI Coordination

## Context

The game currently has planet types with placeholder balance values. This phase establishes the production economy, gives each planet type a distinct strategic identity, implements the Sun's unique global dividend mechanic with shield, and upgrades the AI to coordinate multi-planet attacks.

**What changes:**
- Planet type stats (max units, production rate, neutral garrison) completely rebalanced at 10k scale
- Sun gains a unique global dividend mechanic (+10% production to all owner's planets) and a shield (50% damage absorption)
- Map generation updated for strategic planet placement (ring spawn, Sun center, tiered planet zones)
- AI gains coordinated multi-planet attack capability and planet-type awareness

**What does NOT change:**
- Renderer, camera, input, audio — untouched
- Core fleet movement, combat resolution mechanics — unchanged (just new numbers flowing through them)
- Planet texture/shader pipeline — unchanged

**Ground rules:**
- Do NOT change the renderer or visual pipeline. Planet types already have visual assignments — this phase only changes the gameplay numbers behind them.
- All new constants go in `constants/game.ts` or a new `constants/balance.ts` file.
- The Sun mechanic must work with any player count (2-8) and any map layout.
- Run `npm run build` after each major step.

---

## Part 1: Planet Type Balance

### Design Philosophy

Every planet type has a distinct strategic role. No planet is just "a worse version of another planet." Players should look at the map and make real choices about expansion paths based on what planet types are where.

| Role | Planet Type | Identity |
|---|---|---|
| Economy Engine | Sun | Global buff, high production, shielded, contested objective |
| Anchor | Homeworld | Starting base, high capacity, strong production |
| Vault | Gas Giant | Massive capacity, terrible production, stockpile fortress |
| Forge | Lava World | High production, low capacity, constant aggression pressure |
| Workhorse | Terran | Balanced, reliable, economic backbone |
| Bunker | Ice World | Defensive hold point, decent capacity, slow production |
| Stepping Stone | Dry Terran | Common, modest stats, positioning value |
| Outpost | Barren/Asteroid | Cheap and fast to grab, early game currency |

### Stat Table

Create or update the balance constants. All values are base values.

```typescript
// constants/balance.ts (or add to existing constants/game.ts)

interface PlanetTypeBalance {
  id: string;
  maxUnits: number;
  productionPerSecond: number;
  neutralStartUnits: number;
  shield: number;              // 0.0 = no shield, 0.5 = 50% damage absorbed
  countPerMap: {               // how many of this type appear per game
    min: number;
    max: number;
  };
  special: string | null;      // description of unique mechanic
}

const PLANET_BALANCE: Record<string, PlanetTypeBalance> = {

  sun: {
    id: 'sun',
    maxUnits: 20_000,
    productionPerSecond: 350,
    neutralStartUnits: 5_000,
    shield: 0.5,
    countPerMap: { min: 1, max: 1 },
    special: 'globalDividend',
  },

  homeworld: {
    id: 'homeworld',
    maxUnits: 30_000,
    productionPerSecond: 180,
    neutralStartUnits: 4_000,
    shield: 0.0,
    countPerMap: { min: 1, max: 1 },  // per player
    special: 'homeworld',
  },

  gasGiant: {
    id: 'gasGiant',
    maxUnits: 50_000,
    productionPerSecond: 60,
    neutralStartUnits: 3_000,
    shield: 0.0,
    countPerMap: { min: 1, max: 2 },
    special: null,
  },

  lavaWorld: {
    id: 'lavaWorld',
    maxUnits: 15_000,
    productionPerSecond: 220,
    neutralStartUnits: 2_500,
    shield: 0.0,
    countPerMap: { min: 1, max: 2 },
    special: null,
  },

  terran: {
    id: 'terran',
    maxUnits: 20_000,
    productionPerSecond: 120,
    neutralStartUnits: 2_000,
    shield: 0.0,
    countPerMap: { min: 2, max: 3 },
    special: null,
  },

  iceWorld: {
    id: 'iceWorld',
    maxUnits: 25_000,
    productionPerSecond: 80,
    neutralStartUnits: 2_000,
    shield: 0.0,
    countPerMap: { min: 1, max: 2 },
    special: null,
  },

  dryTerran: {
    id: 'dryTerran',
    maxUnits: 10_000,
    productionPerSecond: 80,
    neutralStartUnits: 1_500,
    shield: 0.0,
    countPerMap: { min: 2, max: 3 },
    special: null,
  },

  barren: {
    id: 'barren',
    maxUnits: 5_000,
    productionPerSecond: 40,
    neutralStartUnits: 800,
    shield: 0.0,
    countPerMap: { min: 2, max: 3 },
    special: null,
  },

} as const;
```

### Number formatting

With units in the thousands, raw numbers are hard to read. Add a display formatter:

```typescript
function formatUnits(n: number): string {
  if (n >= 10_000) return (n / 1000).toFixed(1) + 'k';   // "12.5k"
  if (n >= 1_000) return (n / 1000).toFixed(1) + 'k';    // "1.2k"
  return Math.floor(n).toString();                         // "800"
}
```

Use this everywhere unit counts are displayed: planet labels, fleet labels, HUD stats, post-game stats. The raw number is still used internally for all calculations.

### Random variance (future-proofing)

Add optional variance fields to the balance config, but do NOT apply them yet. Just define the structure so it's ready when we want it:

```typescript
interface PlanetTypeBalance {
  // ... existing fields
  variance?: {
    maxUnits: number;           // ± percentage (e.g., 0.15 = ±15%)
    productionPerSecond: number;
    neutralStartUnits: number;
  };
}
```

When variance is eventually enabled, the actual value for a planet becomes:

```typescript
const actual = base * (1 + seededRandom(planetId) * variance * 2 - variance);
```

This is defined now but NOT active. Leave a comment: `// TODO: Enable variance when balance is stable`.

---

## Part 2: Sun — Global Dividend Mechanic

### How it works

The player who controls the Sun receives a **+10% production bonus on ALL planets they own**, regardless of distance. This is a passive global buff that's recalculated every production tick.

### Implementation

**In `ProductionSystem.ts`** (or wherever production is calculated per tick):

```typescript
function tickProduction(state: GameState, dt: number): void {
  // Determine who owns the Sun
  const sun = state.planets.find(p => p.type === 'sun');
  const sunOwner: PlayerId | null = sun ? sun.owner : null;

  for (const planet of state.planets) {
    if (planet.owner === null) continue; // neutral planets don't produce

    let rate = planet.productionRate;

    // Apply Sun global dividend
    if (sunOwner !== null && planet.owner === sunOwner && planet.type !== 'sun') {
      rate *= 1.10;  // +10% bonus
    }

    planet.units = Math.min(
      planet.maxUnits,
      planet.units + rate * dt
    );
  }
}
```

Note: The Sun itself does NOT get the +10% bonus on its own production (to prevent compounding). Only other planets owned by the Sun's controller get the buff.

### Shield mechanic

**In `CombatResolver.ts`** (or wherever incoming damage is calculated):

```typescript
function resolveCombat(
  attackerUnits: number,
  defenderUnits: number,
  defenderPlanet: Planet
): CombatResult {
  // Apply shield: attacker's effective damage is reduced
  const shield = defenderPlanet.shield ?? 0;
  const effectiveDamage = attackerUnits * (1 - shield);
  // e.g., 50% shield means 1000 attackers only deal 500 damage

  const remaining = defenderUnits - effectiveDamage;

  if (remaining < 0) {
    return {
      captured: true,
      // New owner gets the overflow, but overflow is NOT shielded
      // (shield only protects, doesn't multiply)
      remainingUnits: Math.abs(remaining),
      newOwner: true,
    };
  }

  return {
    captured: false,
    remainingUnits: remaining,
    newOwner: false,
  };
}
```

**Shield math example**: Sun has 5,000 garrison with 50% shield. Attacker sends 8,000 units. Effective damage = 8,000 × 0.5 = 4,000. Defender has 5,000 - 4,000 = 1,000 remaining. Sun is NOT captured. Attacker would need 10,001+ units to crack a 5,000 garrison Sun.

### Visual indicators for Sun mechanics

These are renderer changes but should be noted for implementation:

1. **Shield visual**: The Sun's border ring should have a distinctive look — maybe a double ring, or a shimmer/pulse effect, or a different line style (thicker, brighter). When a shielded planet absorbs damage, show a brief "shield flash" particle effect that's visually distinct from a normal combat impact.

2. **Global dividend visual**: All planets receiving the Sun buff should have a very subtle secondary glow or small icon (like a tiny sun symbol) near their production ring. This communicates "this planet is buffed" at a glance. Keep it subtle — it shouldn't compete with the ownership color or unit count for visual attention.

3. **Sun aura on capture**: When the Sun changes hands, briefly flash all planets that just gained or lost the buff. The new owner's planets get a quick golden shimmer, the old owner's planets briefly dim. This makes the impact of the Sun capture immediately readable.

---

## Part 3: Map Generation — Strategic Layout

### Spawn pattern

Players spawn in a ring around the map perimeter, equidistant from each other:

```
2 players: opposite sides (180°)
3 players: triangle (120° apart)
4 players: cross (90° apart)
5 players: pentagon (72° apart)
6 players: hexagon (60° apart)
7 players: heptagon (~51° apart)
8 players: octagon (45° apart)
```

### Zone system

The map has three concentric zones radiating from the center:

```
┌──────────────────────────────────┐
│  OUTER ZONE                      │
│  (Barren, Dry Terran)            │
│  Backfield behind homeworlds     │
│                                  │
│    ┌──────────────────────┐      │
│    │  MID ZONE             │     │
│    │  (Terran, Ice, Lava)  │     │
│    │  Contested territory  │     │
│    │                       │     │
│    │    ┌────────────┐     │     │
│    │    │ INNER ZONE │     │     │
│    │    │ (Gas Giant) │     │     │
│    │    │    ☀ SUN    │     │     │
│    │    │ (Gas Giant) │     │     │
│    │    └────────────┘     │     │
│    │                       │     │
│    │  HW ●         ● HW   │     │
│    └──────────────────────┘      │
│                                  │
│          ● HW                    │
└──────────────────────────────────┘
```

**Homeworlds** sit on the boundary between Outer and Mid zones. This gives each player a few cheap Barren/Dry Terran planets behind them for safe early expansion, and contested mid-tier planets in front of them.

### Implementation

Update `MapGenerator.ts` with a zone-based placement strategy:

```typescript
interface MapConfig {
  mapSize: 'small' | 'medium' | 'large';
  playerCount: number;
  seed: number;
}

function generateMap(config: MapConfig): Planet[] {
  const world = WORLD_SIZES[config.mapSize];
  const cx = world.width / 2;
  const cy = world.height / 2;
  const planets: Planet[] = [];

  // 1. Place Sun at exact center
  planets.push(createSun(cx, cy));

  // 2. Place homeworlds in a ring
  const homeRadius = Math.min(world.width, world.height) * 0.38;
  for (let i = 0; i < config.playerCount; i++) {
    const angle = (i / config.playerCount) * Math.PI * 2 - Math.PI / 2;
    const hx = cx + Math.cos(angle) * homeRadius;
    const hy = cy + Math.sin(angle) * homeRadius;
    planets.push(createHomeworld(hx, hy, i));
  }

  // 3. Place inner zone planets (Gas Giants near Sun)
  //    Positioned between Sun and homeworlds, offset to not block direct paths
  placeInZone(planets, 'inner', cx, cy, world, config);

  // 4. Place mid zone planets (Terran, Ice, Lava)
  //    The contested area between homeworlds
  placeInZone(planets, 'mid', cx, cy, world, config);

  // 5. Place outer zone planets (Barren, Dry Terran)
  //    Behind each homeworld's position
  placeInZone(planets, 'outer', cx, cy, world, config);

  return planets;
}
```

### Zone definitions

```typescript
const ZONE_CONFIG = {
  inner: {
    radiusMin: 0.08,   // fraction of map half-size, measured from center
    radiusMax: 0.28,
    types: ['gasGiant'],
  },
  mid: {
    radiusMin: 0.25,
    radiusMax: 0.55,
    types: ['terran', 'iceWorld', 'lavaWorld'],
  },
  outer: {
    radiusMin: 0.50,
    radiusMax: 0.85,
    types: ['dryTerran', 'barren'],
  },
} as const;
```

### Backfield spawning

Each player should have 2-3 cheap planets "behind" their homeworld (on the side facing away from the center). These are safe early expansion targets.

```typescript
function placeBackfieldPlanets(
  planets: Planet[],
  homeworld: Planet,
  centerX: number,
  centerY: number,
  count: number,
  seed: number
): void {
  // Direction from center to homeworld = "forward"
  // "Behind" = extending further in that direction
  const angle = Math.atan2(homeworld.y - centerY, homeworld.x - centerX);

  for (let i = 0; i < count; i++) {
    const offset = 80 + i * 100; // spacing behind homeworld
    const spread = (seededRandom(seed + i) - 0.5) * 120; // lateral spread
    const bx = homeworld.x + Math.cos(angle) * offset + Math.cos(angle + Math.PI / 2) * spread;
    const by = homeworld.y + Math.sin(angle) * offset + Math.sin(angle + Math.PI / 2) * spread;
    // Assign Barren or Dry Terran type
    const type = seededRandom(seed + i + 1000) > 0.5 ? 'barren' : 'dryTerran';
    planets.push(createPlanet(bx, by, type, seed + i));
  }
}
```

### Fairness validation

After generating the map, run a fairness check:

```typescript
function validateFairness(planets: Planet[], playerCount: number): boolean {
  for (let i = 0; i < playerCount; i++) {
    const homeworld = planets.find(p => p.type === 'homeworld' && p.owner === i);
    if (!homeworld) return false;

    // Count planets within "easy reach" (closer to this homeworld than any other)
    const nearbyNeutrals = planets.filter(p => {
      if (p.owner !== null) return false;
      if (p.type === 'sun') return false;
      const distToHome = dist(p, homeworld);
      // Check this is the closest homeworld
      return planets
        .filter(h => h.type === 'homeworld' && h.id !== homeworld.id)
        .every(otherHome => dist(p, otherHome) > distToHome);
    });

    // Each player should have at least 3 neutral planets closer to them than anyone else
    if (nearbyNeutrals.length < 3) return false;

    // Distance to Sun should be roughly equal for all players
    const sun = planets.find(p => p.type === 'sun');
    if (sun) {
      const distToSun = dist(homeworld, sun);
      const otherDists = planets
        .filter(h => h.type === 'homeworld' && h.id !== homeworld.id)
        .map(h => dist(h, sun));
      const avgDist = otherDists.reduce((a, b) => a + b, 0) / otherDists.length;
      // No player should be more than 15% closer/farther from Sun than average
      if (Math.abs(distToSun - avgDist) / avgDist > 0.15) return false;
    }
  }
  return true;
}
```

If validation fails, regenerate with a different seed (retry up to 10 times).

### Total planet counts by map size

| Map Size | Players | Sun | Homeworlds | Gas Giant | Lava | Terran | Ice | Dry Terran | Barren | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| Small | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 2 | 2 | 12 |
| Medium | 2-4 | 1 | 2-4 | 2 | 2 | 3 | 2 | 3 | 3 | 18-20 |
| Large | 2-8 | 1 | 2-8 | 2 | 2 | 3 | 2 | 3 | 3 | 18-24 |

These are approximate targets. The generator should aim for these distributions but flex based on available space and collision constraints. The total should scale slightly with player count (more players = more total planets so nobody's starved).

---

## Part 4: AI Multi-Planet Coordination

### Current AI limitation

The bot currently evaluates one planet at a time: "can planet A take planet B?" This leads to inefficient dribbling attacks where the AI sends from one planet, it's not enough, then sends from another later. Against a human who coordinates attacks, the bot gets crushed.

### Coordinated attack system

Replace (or augment) the single-planet evaluation with a coordinated planner:

```typescript
interface AttackPlan {
  target: PlanetId;
  sources: {
    planetId: PlanetId;
    unitsToSend: number;
    estimatedArrivalTime: number;  // seconds, based on distance / fleet speed
  }[];
  totalUnits: number;
  estimatedDefense: number;
  confidence: number;  // ratio of totalUnits / estimatedDefense
}
```

### AI decision flow (new)

```typescript
class BotAI {
  evaluate(state: Readonly<GameState>, dt: number): AIDecision[] {
    // Note: returns ARRAY of decisions, not single decision

    // 1. Identify potential targets, scored by value
    const targets = this.scoreTargets(state);

    // 2. For the top N targets, build coordinated attack plans
    const plans: AttackPlan[] = [];
    for (const target of targets.slice(0, 3)) {
      const plan = this.buildAttackPlan(target, state);
      if (plan && plan.confidence >= this.personality.overpowerRatio) {
        plans.push(plan);
      }
    }

    // 3. Select the best plan and execute all sends
    const bestPlan = this.selectBestPlan(plans);
    if (bestPlan) {
      return bestPlan.sources.map(s => ({
        type: 'sendFleet',
        from: s.planetId,
        to: bestPlan.target,
      }));
    }

    // 4. Fallback: single-planet opportunistic sends (existing logic)
    return this.fallbackSingleSend(state);
  }
}
```

### Building an attack plan

```typescript
buildAttackPlan(targetId: PlanetId, state: Readonly<GameState>): AttackPlan | null {
  const target = state.planets.find(p => p.id === targetId);
  if (!target) return null;

  // Estimate defense at time of arrival
  const baseDefense = target.units;
  const shieldMultiplier = 1 / (1 - (target.shield ?? 0));
  // Account for production during travel time (estimate ~3 seconds average)
  const defenseWithGrowth = target.owner !== null
    ? baseDefense + target.productionRate * 3
    : baseDefense;
  const effectiveDefense = defenseWithGrowth * shieldMultiplier;

  // Find owned planets sorted by distance to target
  const myPlanets = state.planets
    .filter(p => p.owner === this.playerId)
    .map(p => ({
      planet: p,
      distance: dist(p, target),
      available: Math.floor(p.units * SEND_RATIO),
    }))
    .filter(p => p.available > 0)
    .sort((a, b) => a.distance - b.distance);

  // Accumulate senders until we have enough units
  const sources: AttackPlan['sources'] = [];
  let totalUnits = 0;
  const unitsNeeded = effectiveDefense * this.personality.overpowerRatio;

  for (const mp of myPlanets) {
    if (totalUnits >= unitsNeeded) break;

    // Don't drain homeworld below a safety threshold
    if (mp.planet.type === 'homeworld' && mp.planet.units < mp.planet.maxUnits * 0.3) {
      continue;
    }

    // Don't pull from planets that are themselves under threat
    const incomingThreats = this.threatAnalyzer.getIncomingThreats(mp.planet.id, state, this.playerId);
    if (incomingThreats > mp.planet.units * 0.5) continue;

    sources.push({
      planetId: mp.planet.id,
      unitsToSend: mp.available,
      estimatedArrivalTime: mp.distance / FLEET_SPEED,
    });
    totalUnits += mp.available;
  }

  if (totalUnits < effectiveDefense) return null;  // can't take it even with everything

  return {
    target: targetId,
    sources,
    totalUnits,
    estimatedDefense: effectiveDefense,
    confidence: totalUnits / effectiveDefense,
  };
}
```

### Arrival timing (advanced, Hard difficulty only)

For the Hard AI personality, stagger sends so fleets arrive simultaneously:

```typescript
function staggerSends(plan: AttackPlan): AttackPlan {
  // Find the longest travel time
  const maxArrival = Math.max(...plan.sources.map(s => s.estimatedArrivalTime));

  // Add delay to shorter trips so they all arrive at maxArrival
  return {
    ...plan,
    sources: plan.sources.map(s => ({
      ...s,
      delay: maxArrival - s.estimatedArrivalTime,
    })),
  };
}
```

Then in the AI execution, fleet dispatches from closer planets are delayed by their `delay` value. The AI controller tracks pending delayed sends and fires them at the right time.

For Easy and Normal difficulty, just send everything immediately (no stagger). The simultaneous arrival is what makes Hard AI feel genuinely threatening.

### Target scoring

The AI should value planet types differently:

```typescript
function scorePlanetValue(planet: Planet, aiState: AIContext): number {
  let score = 0;

  // Base value by type
  const typeScores: Record<string, number> = {
    sun: 100,        // always highest priority
    homeworld: 80,   // crippling to opponent
    gasGiant: 30,    // only if we have production to fill it
    lavaWorld: 60,   // high production = high value
    terran: 45,      // reliable
    iceWorld: 35,    // decent
    dryTerran: 20,   // filler
    barren: 10,      // cheap grab
  };
  score += typeScores[planet.type] ?? 20;

  // Bonus for enemy planets (offensive value)
  if (planet.owner !== null && planet.owner !== aiState.playerId) {
    score += 15;
    // Extra bonus for enemy homeworlds
    if (planet.type === 'homeworld') score += 30;
  }

  // Bonus for Sun if we don't own it
  if (planet.type === 'sun' && planet.owner !== aiState.playerId) {
    score += 25;
  }

  // Penalty for Gas Giants if we have low total production
  // (no point taking a vault if you can't fill it)
  if (planet.type === 'gasGiant') {
    const myTotalProd = aiState.ownedPlanets.reduce((sum, p) => sum + p.productionRate, 0);
    if (myTotalProd < 150) score -= 20;
  }

  // Penalty for distance (prefer closer targets)
  const nearestOwned = aiState.ownedPlanets.reduce(
    (min, p) => Math.min(min, dist(p, planet)),
    Infinity
  );
  score -= nearestOwned * 0.05;

  // Penalty for heavily defended targets
  const effectiveDef = planet.units * (1 / (1 - (planet.shield ?? 0)));
  score -= effectiveDef * 0.001;

  return score;
}
```

### AI personality adjustments for new balance

Update the personality profiles to work with the new numbers:

```typescript
const AI_PERSONALITIES = {
  passive: {
    name: 'Passive',
    decisionInterval: 2500,
    aggression: 0.2,
    expansionism: 0.8,
    caution: 0.6,
    minimumSendThreshold: 800,     // scaled up from 8
    overpowerRatio: 1.8,
    coordinatedAttacks: false,     // just does single sends
    staggerArrivals: false,
    sunPriority: 0.3,             // low priority for Sun contest
    homeDefenseRatio: 0.5,        // keeps 50% of homeworld units as reserve
  },
  balanced: {
    name: 'Balanced',
    decisionInterval: 1800,
    aggression: 0.5,
    expansionism: 0.5,
    caution: 0.4,
    minimumSendThreshold: 400,
    overpowerRatio: 1.3,
    coordinatedAttacks: true,      // uses multi-planet coordination
    staggerArrivals: false,        // but doesn't time arrivals
    sunPriority: 0.6,
    homeDefenseRatio: 0.3,
  },
  aggressive: {
    name: 'Aggressive',
    decisionInterval: 1200,
    aggression: 0.8,
    expansionism: 0.3,
    caution: 0.2,
    minimumSendThreshold: 200,
    overpowerRatio: 1.0,
    coordinatedAttacks: true,      // uses multi-planet coordination
    staggerArrivals: true,         // AND times arrivals for simultaneous hit
    sunPriority: 0.9,             // aggressively contests the Sun
    homeDefenseRatio: 0.15,       // risky — barely defends home
  },
} as const;
```

---

## Part 5: Engine Integration

### Planet type assignment at game init

When the map generates, each planet gets a type from the balance config. The type determines its stats:

```typescript
function initializePlanetStats(planet: Planet, balance: PlanetTypeBalance): void {
  planet.maxUnits = balance.maxUnits;
  planet.productionRate = balance.productionPerSecond;
  planet.units = balance.neutralStartUnits;  // starting garrison
  planet.shield = balance.shield;
  planet.type = balance.id;
}
```

### Homeworld starting units

Homeworlds should NOT start at their neutral start value (4,000). They're already owned. Start them at a lower active value:

```typescript
// Homeworld starting garrison for the owning player
const HOMEWORLD_STARTING_UNITS = 4_000;
```

This is enough to immediately send a small fleet to nearby planets on turn 1 while keeping a defensive garrison.

### Sun starts neutral

The Sun always starts as a neutral planet with its neutral garrison (5,000). No player owns it at game start. With 50% shield, an attacker needs 10,000+ units to crack it. This ensures the Sun is a mid-game objective, not an early rush target.

### GameState additions

Add to the GameState or Planet interface:

```typescript
interface Planet {
  // ... existing fields
  type: string;                    // planet type id
  shield: number;                  // 0.0 to 1.0
  productionRate: number;          // units per second (base rate before buffs)
  effectiveProductionRate: number; // after Sun dividend applied (recalculated each tick)
}
```

The `effectiveProductionRate` is recalculated every production tick and stored for display purposes (so the tooltip can show the buffed rate).

---

## Part 6: HUD and Display Updates

### Unit count formatting

All unit displays must use the `formatUnits()` formatter:

- Planet unit counts (PlanetLayer): "12.5k" instead of "12500"
- Fleet unit counts (FleetLayer): "3.2k" 
- HUD top bar totals: "45.2k units"
- Post-game stats: "Units produced: 127.4k"
- Tooltips: "Units: 8,432 / 20,000" (tooltip can show exact numbers since there's room)

### Sun visual indicators

Add to PlanetLayer rendering for the Sun:

1. **Shield ring**: Draw an additional outer ring with a distinctive style (double line, or a brighter/thicker ring with slight transparency). This should be visible at all zoom levels.

2. **Dividend indicator**: When a player owns the Sun, all their other planets should show a tiny subtle indicator that they're receiving the buff. Options:
   - A very small sun icon (4-5px) near the production arc
   - A faint golden tint on the production arc
   - A subtle shimmer animation on the border ring

   Keep it VERY subtle. The primary visual feedback should be the Sun's ownership color, not per-planet indicators.

3. **Sun pulsing**: The Sun should have a distinctive visual pulse that's larger/slower than normal planets — emphasize that it's the map's special objective.

### Planet type in tooltip

The planet hover tooltip should now show:

```
Terran Planet
Owner: Player 1
Units: 8,432 / 20,000
Production: 120/sec (+10% ☀)     ← only shows buff if Sun owner
Shield: None
```

For the Sun:

```
☀ Sun
Owner: Bot 1
Units: 14,200 / 20,000
Production: 350/sec
Shield: 50% (×2 to capture)
Buff: +10% production to all planets
```

---

## Testing

### Unit tests

**`CombatResolver.test.ts`** — extend with shield tests:
- 50% shield: 1000 attackers vs 600 defenders = 600 - (1000 × 0.5) = 100 remaining, no capture
- 50% shield: 1400 attackers vs 600 defenders = 600 - (1400 × 0.5) = -100, captured with 100 remaining
- 0% shield: unchanged behavior from before
- Exact threshold: attackers × (1 - shield) = defenders, tie = no capture

**`ProductionSystem.test.ts`** — extend with Sun dividend tests:
- Player owns Sun + 3 planets: each planet produces at 110% rate
- Player loses Sun: production reverts to 100% immediately
- Sun itself does NOT receive the 10% bonus
- Neutral Sun: nobody gets bonus

**`BotAI.test.ts`** — new coordination tests:
- AI builds coordinated plan using multiple planets
- AI doesn't drain homeworld below safety threshold
- AI doesn't pull from threatened planets
- Hard AI staggers sends for simultaneous arrival (verify delay values)
- AI correctly scores Sun higher than Barren planets
- AI scores Gas Giant lower when own production is low

**`MapGenerator.test.ts`** — extend:
- Sun placed at center
- Homeworlds placed equidistantly in ring
- Each player has at least 3 nearby neutral planets
- Sun equidistant from all homeworlds (within 15% tolerance)
- Planet type counts match expected distribution
- Fairness validation passes

### Integration tests

- Start game → verify all planets have correct stats for their type
- Capture Sun → verify production buff applies to all owner's planets
- Lose Sun → verify buff removed
- Shield planet: send insufficient units → verify units are absorbed, no capture
- AI with coordinated attacks enabled: verify it sends from multiple planets in same tick

### Manual testing checklist

- [ ] Start game. Sun visible at center. Homeworlds on ring.
- [ ] Hover Sun tooltip. Shows shield and buff description.
- [ ] Play game. Unit counts display as "1.2k" format.
- [ ] Capture Sun. Verify your planets' tooltip production shows "+10% ☀".
- [ ] Lose Sun. Verify buff disappears from tooltips.
- [ ] Attack Sun with insufficient units. Shield absorbs. Sun not captured.
- [ ] Attack Sun with sufficient units. Sun captured.
- [ ] Observe AI: does it attack from multiple planets simultaneously?
- [ ] Play on Large map with 4+ bots. Game feels balanced (no single bot snowballs from lucky spawn).
- [ ] Check Gas Giants: they have huge capacity but barely produce. Takes forever to fill on their own.
- [ ] Check Lava Worlds: they fill up fast. Good for aggressive pushes.
- [ ] Post-game stats show k-formatted numbers.

---

## Build and verify

```bash
npx tsc --noEmit
npm run build
npm test
```

All must pass. When complete, create `prompts/PHASE_2_5_SUMMARY.md` documenting what was built, balance observations from playtesting, and any tuning adjustments made during implementation.
