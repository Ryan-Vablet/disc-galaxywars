import type { Planet, PlanetId } from "@/types/game";

export type PlanetShaderKey =
  | "noatmosphere"
  | "earth"
  | "ice"
  | "lava"
  | "gasgiant"
  | "gasgiantring"
  | "star"
  | "asteroid"
  | "dry";

export interface PlanetTypeConfig {
  id: PlanetShaderKey;
  name: string;
  minRadius: number;
  maxRadius: number;
  rarity: number;
}

export const PLANET_TYPES: PlanetTypeConfig[] = [
  { id: "noatmosphere", name: "Barren", minRadius: 24, maxRadius: 44, rarity: 3 },
  { id: "earth", name: "Earth", minRadius: 36, maxRadius: 54, rarity: 3 },
  { id: "ice", name: "Ice Planet", minRadius: 28, maxRadius: 46, rarity: 2 },
  { id: "lava", name: "Lava Planet", minRadius: 36, maxRadius: 54, rarity: 2 },
  { id: "gasgiant", name: "Gas Giant", minRadius: 44, maxRadius: 64, rarity: 2 },
  { id: "gasgiantring", name: "Gas Giant Ring", minRadius: 48, maxRadius: 64, rarity: 1 },
  { id: "dry", name: "Dry Planet", minRadius: 30, maxRadius: 52, rarity: 3 },
  { id: "asteroid", name: "Asteroid", minRadius: 20, maxRadius: 34, rarity: 2 },
  { id: "star", name: "Star", minRadius: 24, maxRadius: 36, rarity: 1 },
];

export const ALL_PLANET_TYPE_IDS: PlanetShaderKey[] = PLANET_TYPES.map((t) => t.id);

export function assignPlanetType(planet: Planet, _seed: number): PlanetTypeConfig {
  const id = Number(planet.id);

  switch (planet.type) {
    case "sun":
      return PLANET_TYPES.find((entry) => entry.id === "star") ?? PLANET_TYPES[0]!;
    case "homeworld":
      if (planet.owner === 0) {
        return PLANET_TYPES.find((entry) => entry.id === "earth") ?? PLANET_TYPES[0]!;
      }
      return PLANET_TYPES.find((entry) => entry.id === "lava") ?? PLANET_TYPES[0]!;
    case "gasGiant":
      return PLANET_TYPES.find((entry) => entry.id === (id % 2 === 0 ? "gasgiant" : "gasgiantring")) ?? PLANET_TYPES[0]!;
    case "lavaWorld":
      return PLANET_TYPES.find((entry) => entry.id === "lava") ?? PLANET_TYPES[0]!;
    case "terran":
      return PLANET_TYPES.find((entry) => entry.id === "earth") ?? PLANET_TYPES[0]!;
    case "iceWorld":
      return PLANET_TYPES.find((entry) => entry.id === "ice") ?? PLANET_TYPES[0]!;
    case "dryTerran":
      return PLANET_TYPES.find((entry) => entry.id === "dry") ?? PLANET_TYPES[0]!;
    case "barren":
      return PLANET_TYPES.find((entry) => entry.id === (id % 2 === 0 ? "noatmosphere" : "asteroid")) ?? PLANET_TYPES[0]!;
  }
}

export function dominantColorForType(_typeId: string): [number, number, number, number] {
  return [0.5, 0.5, 0.5, 1];
}
