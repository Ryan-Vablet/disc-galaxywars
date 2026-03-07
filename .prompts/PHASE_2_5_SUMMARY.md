# PHASE 2.5 Summary - Balance, Sun Dividend, and Coordinated AI

## Outcome

Implemented the full Phase 2.5 gameplay pass across balance, map generation, Sun mechanics, coordinated bot attacks, number formatting, tooltip updates, and summary/test coverage. The renderer's shader pipeline was left intact; gameplay now drives planet identity and the 2D overlay layers communicate the new mechanics.

## What Was Built

### Gameplay balance model

- Added `game/client/src/constants/balance.ts` with:
  - `PLANET_BALANCE`
  - `PlanetTypeBalance`
  - `HOMEWORLD_STARTING_UNITS`
  - `SUN_DIVIDEND_MULTIPLIER`
- Extended `Planet` in `game/client/src/types/game.ts` with:
  - `type`
  - `shield`
  - `effectiveProductionRate`
- Added future-proof `variance` fields to the balance config with a TODO note, but did not activate variance yet.

### Sun mechanics

- The Sun is now a first-class gameplay type instead of a special-case visual-only node.
- Shield logic moved into `CombatResolver` as generic shielded damage reduction.
- Production now uses real elapsed seconds (`dtMs / 1000`) instead of the earlier `0.016 * dtFactor` formulation.
- Sun ownership grants `+10%` production to all owned non-Sun planets via `effectiveProductionRate`.
- The Sun does not buff itself.

### Strategic map generation

- Reworked `game/client/src/engine/map/MapGenerator.ts` into a zoned generator:
  - centered Sun
  - homeworld ring
  - inner gas giant placements
  - contested mid planets
  - backfield outer planets behind homeworlds
- Added fairness validation with up to 10 retries.
- Preserved the square-map and centered-Sun work from the recent changes, but folded it into the new zone layout.

### Coordinated AI

- Reworked `BotAI` to support coordinated multi-source attack plans.
- Added:
  - target scoring by gameplay type
  - shield-aware defense estimation
  - homeworld reserve protection
  - threatened-planet avoidance
  - hard-mode staggered arrivals
- Updated AI personalities for the new 10k-scale economy.
- Added delayed-send execution support in `GameEngine` using a simple queue:
  - `{ action, executeAtTime }[]`
- The engine now drains queued delayed AI sends each tick before evaluating new bot actions.

### Display and readability

- Added `game/client/src/utils/formatUnits.ts`:
  - `formatUnits()`
  - `formatExactUnits()`
- Updated unit formatting for:
  - planet labels
  - fleet labels
  - HUD totals
  - post-game stats
- Updated planet hover tooltip to show:
  - gameplay type
  - owner
  - exact units/cap
  - effective production
  - Sun bonus text
  - shield text
- Added subtle Sun-related overlay visuals in `PlanetLayer`:
  - shield ring on the Sun
  - slight Sun pulse emphasis
  - subtle buff indicator on planets receiving the Sun dividend

## Files Added

- `game/client/src/constants/balance.ts`
- `game/client/src/utils/formatUnits.ts`
- `game/client/src/__tests__/engine/BotAI.test.ts`

## Major Files Updated

- `game/client/src/types/game.ts`
- `game/client/src/types/ai.ts`
- `game/client/src/constants/ai.ts`
- `game/client/src/engine/map/MapGenerator.ts`
- `game/client/src/engine/GameEngine.ts`
- `game/client/src/engine/ai/BotAI.ts`
- `game/client/src/engine/systems/ProductionSystem.ts`
- `game/client/src/engine/systems/CombatResolver.ts`
- `game/client/src/engine/systems/FleetSystem.ts`
- `game/client/src/engine/GameStats.ts`
- `game/client/src/planets/PlanetTypes.ts`
- `game/client/src/renderer/layers/PlanetLayer.ts`
- `game/client/src/renderer/layers/FleetLayer.ts`
- `game/client/src/renderer/layers/HUDLayer.ts`
- `game/client/src/renderer/CanvasRenderer.ts`
- `game/client/src/App.ts`

## Tests Added / Extended

- Extended:
  - `game/client/src/__tests__/engine/CombatResolver.test.ts`
  - `game/client/src/__tests__/engine/ProductionSystem.test.ts`
  - `game/client/src/__tests__/engine/MapGenerator.test.ts`
- Added:
  - `game/client/src/__tests__/engine/BotAI.test.ts`

## Verification

- `npx tsc --noEmit` ✅
- `npm run build` ✅
- `npm test` ✅

## Balance / Implementation Notes

- The AI delayed-send queue is intentionally simple and engine-owned. It is not a scheduler subsystem.
- The production system now uses real seconds, so high production values like the Sun's scale correctly with frame time.
- Gameplay type and visual shader type are now separate concerns:
  - gameplay balance is driven by explicit `planet.type`
  - the existing visual pipeline still decides which shader look to use for that gameplay type
- The Sun shield now affects combat math and downstream stats consistently.

## Tuning Notes

- Current map generation prioritizes fairness and readable strategic structure over perfect adherence to the prompt's approximate distribution table.
- The display-side Sun indicators were kept intentionally subtle so they do not overpower ownership rings, unit labels, or the planet shaders.

