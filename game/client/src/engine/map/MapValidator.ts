import { WORLD_SIZES, type WorldSize } from "@/constants/game";
import { dist } from "@/utils/math";
import type { Planet, PlayerId } from "@/types/game";

export interface MapValidation {
  isValid: boolean;
  issues: string[];
}

export interface MapConfig {
  mapSize: WorldSize;
  edgePadding: number;
  minSpacingPadding: number;
}

export function validateMap(planets: Planet[], config: MapConfig): MapValidation {
  const issues: string[] = [];
  const playerHome = planets.find((p) => p.owner === (0 as PlayerId) && p.isHomeworld);
  const enemyHomes = planets.filter(
    (p) => p.owner !== null && p.owner !== (0 as PlayerId) && p.isHomeworld,
  );
  if (!playerHome || enemyHomes.length === 0) {
    issues.push("Missing required player/bot homeworlds");
  }

  // Use world-space dimensions from WORLD_SIZES
  const worldSize = WORLD_SIZES[config.mapSize];
  const width = worldSize.width;
  const height = worldSize.height;

  for (let i = 0; i < planets.length; i += 1) {
    const planet = planets[i];
    if (!planet) {
      continue;
    }
    if (
      planet.x - planet.radius < config.edgePadding ||
      planet.x + planet.radius > width - config.edgePadding ||
      planet.y - planet.radius < config.edgePadding ||
      planet.y + planet.radius > height - config.edgePadding
    ) {
      issues.push(`Planet ${planet.id} out of bounds`);
    }

    for (let j = i + 1; j < planets.length; j += 1) {
      const other = planets[j];
      if (!other) {
        continue;
      }
      if (dist(planet, other) < planet.radius + other.radius + config.minSpacingPadding) {
        issues.push(`Planet overlap: ${planet.id}/${other.id}`);
      }
    }
  }
  return { isValid: issues.length === 0, issues };
}
