import { describe, expect, it } from "vitest";
import { GameStatsTracker } from "@/engine/GameStats";
import type { PlayerId } from "@/types/game";

describe("GameStatsTracker", () => {
  it("tracks key counters from events and frames", () => {
    const tracker = new GameStatsTracker([0 as PlayerId, 1 as PlayerId]);
    tracker.recordProduction(0 as PlayerId, 12);
    tracker.recordEvent({
      type: "fleet_launched",
      fleet: {
        id: 1 as never,
        fromId: 0 as never,
        toId: 1 as never,
        owner: 0 as PlayerId,
        units: 10,
        x: 0,
        y: 0,
        tx: 10,
        ty: 10,
        angle: 0,
        totalDistance: 10,
        traveled: 0,
      },
      from: {
        id: 0 as never,
        x: 0,
        y: 0,
        radius: 30,
        type: "homeworld",
        isHomeworld: true,
        owner: 0 as PlayerId,
        units: 30,
        maxUnits: 100,
        productionRate: 0.3,
        effectiveProductionRate: 0.3,
        shield: 0,
      },
    });
    tracker.recordEvent({
      type: "planet_captured",
      planet: {
        id: 1 as never,
        x: 0,
        y: 0,
        radius: 30,
        type: "homeworld",
        isHomeworld: true,
        owner: 0 as PlayerId,
        units: 5,
        maxUnits: 100,
        productionRate: 0.3,
        effectiveProductionRate: 0.3,
        shield: 0,
      },
      newOwner: 0 as PlayerId,
      previousOwner: 1 as PlayerId,
    });
    tracker.updateFrame({
      planets: [
        {
          id: 0 as never,
          x: 0,
          y: 0,
          radius: 30,
          type: "homeworld",
          isHomeworld: true,
          owner: 0 as PlayerId,
          units: 40,
          maxUnits: 100,
          productionRate: 0.3,
          effectiveProductionRate: 0.3,
          shield: 0,
        },
      ],
      fleets: [],
      players: [],
      status: "playing",
      winner: null,
      timeMs: 95000,
    });

    const player = tracker.getStatsFor(0 as PlayerId);
    expect(player.unitsProduced).toBe(12);
    expect(player.fleetsLaunched).toBe(1);
    expect(player.planetsCaptured).toBe(1);
    expect(player.peakUnits).toBe(40);
    expect(player.gameDuration).toBe(95);
  });
});
