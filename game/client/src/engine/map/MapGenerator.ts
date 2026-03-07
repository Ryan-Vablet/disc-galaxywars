import { HOMEWORLD_STARTING_UNITS, getPlanetBalance } from "@/constants/balance";
import { GAME_CONSTANTS, WORLD_SIZES, type WorldSize } from "@/constants/game";
import type { Planet, PlanetGameplayType, PlanetId, PlayerId } from "@/types/game";
import { dist, rand, randInt } from "@/utils/math";

export interface MapGeneratorInput {
  playerIds: PlayerId[];
  mapSize: WorldSize;
  homeUnits: number;
}

const MAP_LAYOUT = {
  small: { backfieldPerPlayer: 2, gasGiants: 1, extraMidPlanets: 1 },
  medium: { backfieldPerPlayer: 2, gasGiants: 2, extraMidPlanets: 3 },
  large: { backfieldPerPlayer: 3, gasGiants: 2, extraMidPlanets: 5 },
} as const;

const PLANET_RADII: Record<PlanetGameplayType, number> = {
  sun: GAME_CONSTANTS.sunRadius,
  homeworld: GAME_CONSTANTS.planetMaxRadius,
  gasGiant: 60,
  lavaWorld: 46,
  terran: 44,
  iceWorld: 48,
  dryTerran: 38,
  barren: 30,
};

const MID_TYPES: PlanetGameplayType[] = ["terran", "iceWorld", "lavaWorld"];
const OUTER_TYPES: PlanetGameplayType[] = ["dryTerran", "barren"];

export class MapGenerator {
  private lastRetryCount = 0;

  public generate(config: MapGeneratorInput): Planet[] {
    let lastAttempt: Planet[] = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      lastAttempt = this.generateCandidate(config);
      if (this.validateFairness(lastAttempt, config.playerIds.length)) {
        this.lastRetryCount = attempt;
        return lastAttempt;
      }
    }
    this.lastRetryCount = 9;
    return lastAttempt;
  }

  public getLastRetryCount(): number {
    return this.lastRetryCount;
  }

  private generateCandidate(config: MapGeneratorInput): Planet[] {
    const planets: Planet[] = [];
    const playerCount = config.playerIds.length;
    const worldSize = WORLD_SIZES[config.mapSize];
    const width = worldSize.width;
    const height = worldSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const halfSize = Math.min(width, height) / 2;
    const homeRadius = halfSize * 0.6;
    const layout = MAP_LAYOUT[config.mapSize];
    let nextId = 0;

    planets.push(this.createPlanet(nextId++, "sun", centerX, centerY, null));

    const homeworlds = config.playerIds.map((playerId, index) => {
      const angle = (Math.PI * 2 * index) / playerCount - Math.PI / 2;
      const x = centerX + Math.cos(angle) * homeRadius;
      const y = centerY + Math.sin(angle) * homeRadius;
      const homeworld = this.createPlanet(nextId++, "homeworld", x, y, playerId);
      planets.push(homeworld);
      return { homeworld, angle };
    });

    for (const [index, { angle }] of homeworlds.entries()) {
      const gasAngle = angle + Math.PI / playerCount;
      if (index < layout.gasGiants) {
        this.placePolarPlanet(planets, nextId++, "gasGiant", centerX, centerY, halfSize * 0.22, gasAngle, width, height);
      }
    }

    for (const [index, { homeworld, angle }] of homeworlds.entries()) {
      const backfieldCount = layout.backfieldPerPlayer;
      for (let i = 0; i < backfieldCount; i += 1) {
        const type = OUTER_TYPES[(i + index) % OUTER_TYPES.length]!;
        const radialOffset = 90 + i * 90;
        const lateralSpread = (i - (backfieldCount - 1) / 2) * 90;
        const x =
          homeworld.x +
          Math.cos(angle) * radialOffset +
          Math.cos(angle + Math.PI / 2) * lateralSpread;
        const y =
          homeworld.y +
          Math.sin(angle) * radialOffset +
          Math.sin(angle + Math.PI / 2) * lateralSpread;
        this.placeCartesianPlanet(planets, nextId++, type, x, y, width, height);
      }

      const midType = MID_TYPES[index % MID_TYPES.length]!;
      const contestedRadius = halfSize * rand(0.38, 0.5);
      const contestedAngle = angle + rand(-0.18, 0.18);
      this.placePolarPlanet(
        planets,
        nextId++,
        midType,
        centerX,
        centerY,
        contestedRadius,
        contestedAngle,
        width,
        height,
      );
    }

    for (let i = 0; i < layout.extraMidPlanets; i += 1) {
      const type = MID_TYPES[i % MID_TYPES.length]!;
      const angle = (Math.PI * 2 * i) / layout.extraMidPlanets - Math.PI / 2 + Math.PI / Math.max(playerCount, 2);
      const radius = halfSize * rand(0.33, 0.48);
      this.placePolarPlanet(planets, nextId++, type, centerX, centerY, radius, angle, width, height);
    }

    return planets;
  }

  private createPlanet(
    id: number,
    type: PlanetGameplayType,
    x: number,
    y: number,
    owner: PlayerId | null,
  ): Planet {
    const balance = getPlanetBalance(type);
    const isHomeworld = type === "homeworld";
    const isSun = type === "sun";
    const units = isHomeworld && owner !== null ? HOMEWORLD_STARTING_UNITS : balance.neutralStartUnits;
    return {
      id: id as PlanetId,
      x,
      y,
      radius: PLANET_RADII[type],
      type,
      isHomeworld,
      owner,
      units,
      maxUnits: balance.maxUnits,
      productionRate: balance.productionPerSecond,
      effectiveProductionRate: balance.productionPerSecond,
      shield: balance.shield,
      isSun,
    };
  }

  private placeCartesianPlanet(
    planets: Planet[],
    id: number,
    type: PlanetGameplayType,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const candidate = this.createPlanet(id, type, x, y, null);
    if (this.isValidPosition(candidate, planets, width, height)) {
      planets.push(candidate);
    }
  }

  private placePolarPlanet(
    planets: Planet[],
    id: number,
    type: PlanetGameplayType,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    width: number,
    height: number,
  ): void {
    const attempts = 16;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const a = angle + rand(-0.15, 0.15) * attempt;
      const r = radius + rand(-20, 20) * attempt * 0.25;
      const candidate = this.createPlanet(
        id,
        type,
        centerX + Math.cos(a) * r,
        centerY + Math.sin(a) * r,
        null,
      );
      if (this.isValidPosition(candidate, planets, width, height)) {
        planets.push(candidate);
        return;
      }
    }
  }

  private isValidPosition(candidate: Planet, planets: Planet[], width: number, height: number): boolean {
    const pad = GAME_CONSTANTS.mapPadding;
    if (
      candidate.x - candidate.radius < pad ||
      candidate.x + candidate.radius > width - pad ||
      candidate.y - candidate.radius < pad ||
      candidate.y + candidate.radius > height - pad
    ) {
      return false;
    }

    for (const existing of planets) {
      const spacing = existing.isSun || candidate.isSun ? 90 : 55;
      if (dist(existing, candidate) < existing.radius + candidate.radius + spacing) {
        return false;
      }
    }
    return true;
  }

  private validateFairness(planets: Planet[], playerCount: number): boolean {
    const sun = planets.find((planet) => planet.type === "sun");
    const homeworlds = planets.filter((planet) => planet.type === "homeworld");
    if (!sun || homeworlds.length !== playerCount) {
      return false;
    }

    for (const homeworld of homeworlds) {
      const nearbyNeutrals = planets.filter((planet) => {
        if (planet.owner !== null || planet.type === "sun") {
          return false;
        }
        const distToHome = dist(planet, homeworld);
        return homeworlds
          .filter((other) => other.id !== homeworld.id)
          .every((other) => dist(planet, other) > distToHome);
      });
      if (nearbyNeutrals.length < 3) {
        return false;
      }
    }

    const homeDistances = homeworlds.map((planet) => dist(planet, sun));
    const avgDistance = homeDistances.reduce((sum, value) => sum + value, 0) / homeDistances.length;
    return homeDistances.every((value) => Math.abs(value - avgDistance) / avgDistance <= 0.15);
  }
}
