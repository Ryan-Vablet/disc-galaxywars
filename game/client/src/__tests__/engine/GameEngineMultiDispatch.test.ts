import { describe, expect, it } from "vitest";
import { GameEngine } from "@/engine/GameEngine";
import type { PlanetId, PlayerId } from "@/types/game";

describe("GameEngine dispatchMultiFleet", () => {
  it("dispatches fleets from multiple sources", () => {
    const engine = new GameEngine(
      {
        width: 1200,
        height: 800,
        playerId: 0 as PlayerId,
        botCount: 2,
        mapSize: "small",
        homeUnits: 30,
      },
      "balanced",
    );
    const playerPlanets = engine
      .getState()
      .planets.filter((planet) => planet.owner === (0 as PlayerId))
      .map((planet) => planet.id);
    const target = engine
      .getState()
      .planets.find((planet) => planet.owner !== (0 as PlayerId))?.id as PlanetId;

    const results = engine.dispatchMultiFleet(playerPlanets, target, 0 as PlayerId);
    expect(results.length).toBe(playerPlanets.length);
    expect(results.some((entry) => entry.ok)).toBe(true);
  });
});
