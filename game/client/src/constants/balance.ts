import type { PlanetGameplayType } from "@/types/game";

export interface PlanetTypeBalance {
  id: PlanetGameplayType;
  maxUnits: number;
  productionPerSecond: number;
  neutralStartUnits: number;
  shield: number;
  countPerMap: {
    min: number;
    max: number;
  };
  special: string | null;
  // TODO: Enable variance when balance is stable.
  variance?: {
    maxUnits: number;
    productionPerSecond: number;
    neutralStartUnits: number;
  };
}

export const HOMEWORLD_STARTING_UNITS = 4_000;
export const SUN_DIVIDEND_MULTIPLIER = 1.1;

export const PLANET_BALANCE: Record<PlanetGameplayType, PlanetTypeBalance> = {
  sun: {
    id: "sun",
    maxUnits: 20_000,
    productionPerSecond: 350,
    neutralStartUnits: 5_000,
    shield: 0.5,
    countPerMap: { min: 1, max: 1 },
    special: "globalDividend",
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  homeworld: {
    id: "homeworld",
    maxUnits: 30_000,
    productionPerSecond: 180,
    neutralStartUnits: 4_000,
    shield: 0,
    countPerMap: { min: 1, max: 1 },
    special: "homeworld",
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  gasGiant: {
    id: "gasGiant",
    maxUnits: 50_000,
    productionPerSecond: 60,
    neutralStartUnits: 3_000,
    shield: 0,
    countPerMap: { min: 1, max: 2 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  lavaWorld: {
    id: "lavaWorld",
    maxUnits: 15_000,
    productionPerSecond: 220,
    neutralStartUnits: 2_500,
    shield: 0,
    countPerMap: { min: 1, max: 2 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  terran: {
    id: "terran",
    maxUnits: 20_000,
    productionPerSecond: 120,
    neutralStartUnits: 2_000,
    shield: 0,
    countPerMap: { min: 2, max: 3 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  iceWorld: {
    id: "iceWorld",
    maxUnits: 25_000,
    productionPerSecond: 80,
    neutralStartUnits: 2_000,
    shield: 0,
    countPerMap: { min: 1, max: 2 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  dryTerran: {
    id: "dryTerran",
    maxUnits: 10_000,
    productionPerSecond: 80,
    neutralStartUnits: 1_500,
    shield: 0,
    countPerMap: { min: 2, max: 3 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
  barren: {
    id: "barren",
    maxUnits: 5_000,
    productionPerSecond: 40,
    neutralStartUnits: 800,
    shield: 0,
    countPerMap: { min: 2, max: 3 },
    special: null,
    variance: { maxUnits: 0.15, productionPerSecond: 0.15, neutralStartUnits: 0.15 },
  },
};

export function getPlanetBalance(type: PlanetGameplayType): PlanetTypeBalance {
  return PLANET_BALANCE[type];
}
