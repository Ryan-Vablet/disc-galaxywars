import { describe, expect, it } from "vitest";
import { ProductionSystem } from "@/engine/systems/ProductionSystem";
import type { GameState, PlayerId } from "@/types/game";

describe("ProductionSystem", () => {
  it("produces only on owned planets and caps at max", () => {
    const system = new ProductionSystem();
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
          maxUnits: 11,
          productionRate: 100,
          effectiveProductionRate: 100,
          shield: 0,
        },
        {
          id: 1 as never,
          x: 50,
          y: 0,
          radius: 30,
          type: "barren",
          isHomeworld: false,
          owner: null,
          units: 5,
          maxUnits: 20,
          productionRate: 100,
          effectiveProductionRate: 100,
          shield: 0,
        },
      ],
      fleets: [],
      players: [],
      status: "playing",
      winner: null,
      timeMs: 0,
    };

    system.tick(state, 16);
    expect(state.planets[0]?.units).toBe(11);
    expect(state.planets[1]?.units).toBe(5);
    expect(state.planets[0]?.effectiveProductionRate).toBe(100);
  });

  it("applies the Sun dividend to all owned non-sun planets", () => {
    const system = new ProductionSystem();
    const state: GameState = {
      planets: [
        {
          id: 0 as never,
          x: 0,
          y: 0,
          radius: 40,
          type: "sun",
          isHomeworld: false,
          owner: 0 as PlayerId,
          units: 5000,
          maxUnits: 20000,
          productionRate: 350,
          effectiveProductionRate: 350,
          shield: 0.5,
          isSun: true,
        },
        {
          id: 1 as never,
          x: 80,
          y: 0,
          radius: 55,
          type: "homeworld",
          isHomeworld: true,
          owner: 0 as PlayerId,
          units: 4000,
          maxUnits: 30000,
          productionRate: 100,
          effectiveProductionRate: 100,
          shield: 0,
        },
        {
          id: 2 as never,
          x: 160,
          y: 0,
          radius: 40,
          type: "terran",
          isHomeworld: false,
          owner: 0 as PlayerId,
          units: 1000,
          maxUnits: 20000,
          productionRate: 50,
          effectiveProductionRate: 50,
          shield: 0,
        },
      ],
      fleets: [],
      players: [],
      status: "playing",
      winner: null,
      timeMs: 0,
    };

    system.tick(state, 1000);
    expect(state.planets[0]?.units).toBe(5350);
    expect(state.planets[0]?.effectiveProductionRate).toBe(350);
    expect(state.planets[1]?.units).toBe(4110);
    expect(state.planets[1]?.effectiveProductionRate).toBeCloseTo(110, 6);
    expect(state.planets[2]?.units).toBe(1055);
    expect(state.planets[2]?.effectiveProductionRate).toBeCloseTo(55, 6);
  });

  it("removes the Sun dividend immediately when the Sun is neutral", () => {
    const system = new ProductionSystem();
    const state: GameState = {
      planets: [
        {
          id: 0 as never,
          x: 0,
          y: 0,
          radius: 40,
          type: "sun",
          isHomeworld: false,
          owner: null,
          units: 5000,
          maxUnits: 20000,
          productionRate: 350,
          effectiveProductionRate: 350,
          shield: 0.5,
          isSun: true,
        },
        {
          id: 1 as never,
          x: 80,
          y: 0,
          radius: 40,
          type: "terran",
          isHomeworld: false,
          owner: 0 as PlayerId,
          units: 1000,
          maxUnits: 20000,
          productionRate: 120,
          effectiveProductionRate: 120,
          shield: 0,
        },
      ],
      fleets: [],
      players: [],
      status: "playing",
      winner: null,
      timeMs: 0,
    };

    system.tick(state, 1000);
    expect(state.planets[1]?.units).toBe(1120);
    expect(state.planets[1]?.effectiveProductionRate).toBe(120);
  });
});
