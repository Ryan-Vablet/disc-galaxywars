import { describe, expect, it } from "vitest";
import { WORLD_SIZES } from "@/constants/game";
import { MapGenerator } from "@/engine/map/MapGenerator";
import { validateMap } from "@/engine/map/MapValidator";
import type { Planet, PlayerId } from "@/types/game";

function nearbyNeutralCount(planets: Planet[], homeworld: Planet): number {
  const homeworlds = planets.filter((planet) => planet.type === "homeworld");
  return planets.filter((planet) => {
    if (planet.owner !== null || planet.type === "sun") {
      return false;
    }
    const distToHome = Math.hypot(planet.x - homeworld.x, planet.y - homeworld.y);
    return homeworlds
      .filter((other) => other.id !== homeworld.id)
      .every((other) => Math.hypot(planet.x - other.x, planet.y - other.y) > distToHome);
  }).length;
}

describe("MapGenerator", () => {
  it("generates a fair zoned map with a center sun and ring homeworlds", () => {
    const generator = new MapGenerator();
    const planets = generator.generate({
      playerIds: [0 as PlayerId, 1 as PlayerId, 2 as PlayerId, 3 as PlayerId],
      mapSize: "medium",
      homeUnits: 4000,
    });

    const validation = validateMap(planets, {
      mapSize: "medium",
      edgePadding: 80,
      minSpacingPadding: 50,
    });
    expect(validation.isValid).toBe(true);

    const world = WORLD_SIZES.medium;
    const sun = planets.find((planet) => planet.type === "sun");
    expect(sun).toBeDefined();
    expect(sun?.x).toBeCloseTo(world.width / 2, 4);
    expect(sun?.y).toBeCloseTo(world.height / 2, 4);

    const homeworlds = planets.filter((planet) => planet.type === "homeworld");
    expect(homeworlds).toHaveLength(4);

    const distances = homeworlds.map((planet) => Math.hypot(planet.x - world.width / 2, planet.y - world.height / 2));
    const avgDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length;
    distances.forEach((value) => {
      expect(Math.abs(value - avgDistance) / avgDistance).toBeLessThanOrEqual(0.15);
    });

    homeworlds.forEach((homeworld) => {
      expect(nearbyNeutralCount(planets, homeworld)).toBeGreaterThanOrEqual(2);
    });

    expect(planets.some((planet) => planet.type === "gasGiant")).toBe(true);
    expect(planets.some((planet) => planet.type === "lavaWorld")).toBe(true);
    expect(planets.some((planet) => planet.type === "iceWorld")).toBe(true);
    expect(planets.some((planet) => planet.type === "terran")).toBe(true);
    expect(planets.some((planet) => planet.type === "dryTerran")).toBe(true);
    expect(planets.some((planet) => planet.type === "barren")).toBe(true);
  });
});
