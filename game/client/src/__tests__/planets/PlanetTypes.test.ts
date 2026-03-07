import { describe, expect, it } from "vitest";
import { assignPlanetType } from "@/planets/PlanetTypes";
import type { Planet, PlayerId } from "@/types/game";

const basePlanet: Planet = {
  id: 5 as never,
  x: 0,
  y: 0,
  radius: 40,
  type: "terran",
  isHomeworld: false,
  owner: null,
  units: 10,
  maxUnits: 100,
  productionRate: 0.3,
  effectiveProductionRate: 0.3,
  shield: 0,
};

describe("PlanetTypes", () => {
  it("assigns deterministically for same id and seed", () => {
    const a = assignPlanetType(basePlanet, 123);
    const b = assignPlanetType(basePlanet, 123);
    expect(a.id).toBe(b.id);
  });

  it("forces player homeworld to terran style", () => {
    const type = assignPlanetType(
      { ...basePlanet, id: 0 as never, type: "homeworld", isHomeworld: true, owner: 0 as PlayerId },
      42,
    );
    expect(type.id).toBe("earth");
  });
});
