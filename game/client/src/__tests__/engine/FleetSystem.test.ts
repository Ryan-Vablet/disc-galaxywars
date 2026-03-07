import { describe, expect, it } from "vitest";
import { FleetSystem } from "@/engine/systems/FleetSystem";
import type { GameState, PlayerId } from "@/types/game";

describe("FleetSystem", () => {
  it("arrives and captures weaker target", () => {
    const fleetSystem = new FleetSystem();
    const state: GameState = {
      planets: [
        {
          id: 0 as never,
          x: 0,
          y: 0,
          radius: 30,
          type: "homeworld",
          isHomeworld: true,
          owner: 0 as PlayerId,
          units: 10,
          maxUnits: 20,
          productionRate: 0.2,
          effectiveProductionRate: 0.2,
          shield: 0,
        },
        {
          id: 1 as never,
          x: 4,
          y: 0,
          radius: 30,
          type: "homeworld",
          isHomeworld: true,
          owner: 1 as PlayerId,
          units: 2,
          maxUnits: 20,
          productionRate: 0.2,
          effectiveProductionRate: 0.2,
          shield: 0,
        },
      ],
      fleets: [
        {
          id: 1 as never,
          fromId: 0 as never,
          toId: 1 as never,
          owner: 0 as PlayerId,
          units: 8,
          x: 0,
          y: 0,
          tx: 4,
          ty: 0,
          angle: 0,
          totalDistance: 4,
          traveled: 0,
        },
      ],
      players: [],
      status: "playing",
      winner: null,
      timeMs: 0,
    };
    const events = fleetSystem.tick(state, 16);
    expect(state.fleets.length).toBe(0);
    expect(state.planets[1]?.owner).toBe(0);
    expect(events.some((event) => event.type === "planet_captured")).toBe(true);
  });
});
