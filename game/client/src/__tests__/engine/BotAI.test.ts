import { describe, expect, it } from "vitest";
import { AI_PERSONALITIES } from "@/constants/ai";
import { BotAI } from "@/engine/ai/BotAI";
import type { GameState, Planet, PlayerId } from "@/types/game";

function makePlanet(overrides: Partial<Planet> & Pick<Planet, "id" | "type" | "owner">): Planet {
  const typeDefaults: Record<Planet["type"], Pick<Planet, "radius" | "maxUnits" | "productionRate" | "shield">> = {
    sun: { radius: 110, maxUnits: 20000, productionRate: 350, shield: 0.5 },
    homeworld: { radius: 55, maxUnits: 30000, productionRate: 180, shield: 0 },
    gasGiant: { radius: 60, maxUnits: 50000, productionRate: 60, shield: 0 },
    lavaWorld: { radius: 46, maxUnits: 15000, productionRate: 220, shield: 0 },
    terran: { radius: 44, maxUnits: 20000, productionRate: 120, shield: 0 },
    iceWorld: { radius: 48, maxUnits: 25000, productionRate: 80, shield: 0 },
    dryTerran: { radius: 38, maxUnits: 10000, productionRate: 80, shield: 0 },
    barren: { radius: 30, maxUnits: 5000, productionRate: 40, shield: 0 },
  };
  const defaults = typeDefaults[overrides.type];
  return {
    x: 0,
    y: 0,
    isHomeworld: overrides.type === "homeworld",
    units: 2000,
    effectiveProductionRate: defaults.productionRate,
    isSun: overrides.type === "sun",
    ...defaults,
    ...overrides,
  };
}

function makeState(planets: Planet[]): GameState {
  return {
    planets,
    fleets: [],
    players: [],
    status: "playing",
    winner: null,
    timeMs: 0,
  };
}

describe("BotAI", () => {
  it("builds a coordinated attack plan using multiple planets", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.balanced);
    const state = makeState([
      makePlanet({ id: 1 as never, type: "homeworld", owner: 1 as PlayerId, x: 0, y: 0, units: 12000 }),
      makePlanet({ id: 2 as never, type: "terran", owner: 1 as PlayerId, x: 120, y: 0, units: 6000 }),
      makePlanet({ id: 3 as never, type: "dryTerran", owner: 1 as PlayerId, x: 240, y: 0, units: 5000 }),
      makePlanet({ id: 10 as never, type: "lavaWorld", owner: 0 as PlayerId, x: 500, y: 0, units: 12000 }),
    ]);

    const plan = (ai as any).buildAttackPlan(10 as never, state);
    expect(plan).not.toBeNull();
    expect(plan.sources.length).toBeGreaterThan(1);
  });

  it("does not drain a low-reserve homeworld below its safety threshold", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.balanced);
    const state = makeState([
      makePlanet({ id: 1 as never, type: "homeworld", owner: 1 as PlayerId, x: 0, y: 0, units: 5000 }),
      makePlanet({ id: 2 as never, type: "terran", owner: 1 as PlayerId, x: 100, y: 0, units: 5000 }),
      makePlanet({ id: 10 as never, type: "barren", owner: null, x: 220, y: 0, units: 1000 }),
    ]);

    const plan = (ai as any).buildAttackPlan(10 as never, state);
    expect(plan).not.toBeNull();
    expect(plan.sources.some((source: { planetId: number }) => source.planetId === 1)).toBe(false);
  });

  it("does not pull from threatened planets", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.balanced);
    const state = makeState([
      makePlanet({ id: 1 as never, type: "terran", owner: 1 as PlayerId, x: 0, y: 0, units: 5000 }),
      makePlanet({ id: 2 as never, type: "terran", owner: 1 as PlayerId, x: 120, y: 0, units: 5000 }),
      makePlanet({ id: 10 as never, type: "barren", owner: null, x: 240, y: 0, units: 1200 }),
    ]);
    state.fleets.push({
      id: 99 as never,
      fromId: 10 as never,
      toId: 1 as never,
      owner: 0 as PlayerId,
      units: 3000,
      x: 200,
      y: 0,
      tx: 0,
      ty: 0,
      angle: Math.PI,
      totalDistance: 200,
      traveled: 0,
    });

    const plan = (ai as any).buildAttackPlan(10 as never, state);
    expect(plan).not.toBeNull();
    expect(plan.sources.some((source: { planetId: number }) => source.planetId === 1)).toBe(false);
  });

  it("hard AI staggers sends so closer planets wait", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.aggressive);
    const state = makeState([
      makePlanet({ id: 1 as never, type: "homeworld", owner: 1 as PlayerId, x: 0, y: 0, units: 14000 }),
      makePlanet({ id: 2 as never, type: "terran", owner: 1 as PlayerId, x: 250, y: 0, units: 7000 }),
      makePlanet({ id: 10 as never, type: "sun", owner: null, x: 600, y: 0, units: 5000 }),
    ]);

    const decisions = ai.evaluate(state, AI_PERSONALITIES.aggressive.decisionIntervalMs);
    expect(decisions.length).toBeGreaterThan(1);
    expect(decisions.some((decision) => (decision.delayMs ?? 0) > 0)).toBe(true);
  });

  it("scores the Sun higher than a barren planet", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.balanced);
    const owned = [makePlanet({ id: 1 as never, type: "homeworld", owner: 1 as PlayerId, x: 0, y: 0, units: 6000 })];
    const sunScore = (ai as any).scorePlanetValue(
      makePlanet({ id: 10 as never, type: "sun", owner: null, x: 300, y: 0, units: 5000 }),
      owned,
    );
    const barrenScore = (ai as any).scorePlanetValue(
      makePlanet({ id: 11 as never, type: "barren", owner: null, x: 300, y: 0, units: 800 }),
      owned,
    );
    expect(sunScore).toBeGreaterThan(barrenScore);
  });

  it("scores gas giants lower when own production is low", () => {
    const ai = new BotAI(1 as PlayerId, AI_PERSONALITIES.balanced);
    const lowProdOwned = [
      makePlanet({ id: 1 as never, type: "barren", owner: 1 as PlayerId, x: 0, y: 0, units: 3000, productionRate: 40, effectiveProductionRate: 40 }),
      makePlanet({ id: 2 as never, type: "dryTerran", owner: 1 as PlayerId, x: 100, y: 0, units: 3000, productionRate: 80, effectiveProductionRate: 80 }),
    ];
    const gasScore = (ai as any).scorePlanetValue(
      makePlanet({ id: 10 as never, type: "gasGiant", owner: null, x: 200, y: 0, units: 3000 }),
      lowProdOwned,
    );
    const terranScore = (ai as any).scorePlanetValue(
      makePlanet({ id: 11 as never, type: "terran", owner: null, x: 200, y: 0, units: 2000 }),
      lowProdOwned,
    );
    expect(gasScore).toBeLessThan(terranScore);
  });
});
