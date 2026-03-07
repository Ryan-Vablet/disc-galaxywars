export const GAME_CONSTANTS = {
  planetMinRadius: 28,
  planetMaxRadius: 55, // Increased for homeworld size
  productionBase: 1.0, // Production rates are now units per second
  fleetSpeedPerFrame: 2.2,
  sendRatio: 0.55,
  mapPadding: 80,
  minPlanetSpacing: 50,
  homePlanetOffset: 60,
  homeMaxUnits: 100,
  frameDurationMs: 16,
  // Center sun (capturable node; sprite drawn 2× in PlanetLayer)
  sunRadius: 110,
  sunProductionRate: 1.5,
  sunMaxUnits: 150,
  sunInitialUnits: 50,
  /** Min distance from map center for neutral planet placement (buffer around sun). */
  sunBuffer: 180,
} as const;

export const GAME_SPEED_MULTIPLIERS = {
  slowest: 0.5,
  slow: 0.75,
  normal: 1,
  fast: 1.35,
  fastest: 1.75,
} as const;

/**
 * World sizes for map generation in world-space units.
 * Square dimensions so every player has equal space "behind" them for neutral spawns (fair play).
 */
export const WORLD_SIZES = {
  small: { width: 1200, height: 1200 },
  medium: { width: 1800, height: 1800 },
  large: { width: 2600, height: 2600 },
} as const;

export type WorldSize = keyof typeof WORLD_SIZES;
