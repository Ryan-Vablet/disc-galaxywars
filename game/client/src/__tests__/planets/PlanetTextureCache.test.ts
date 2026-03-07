import { describe, expect, it } from "vitest";
import { PlanetTextureCache } from "@/planets/PlanetTextureCache";
import type { Planet } from "@/types/game";

describe("PlanetTextureCache", () => {
  it("generates and retrieves textures", async () => {
    const cache = new PlanetTextureCache();
    const planets: Planet[] = [
      {
        id: 0 as never,
        x: 0,
        y: 0,
        radius: 42,
        type: "homeworld",
        isHomeworld: true,
        owner: 0 as never,
        units: 30,
        maxUnits: 100,
        productionRate: 0.3,
        effectiveProductionRate: 0.3,
        shield: 0,
      },
      {
        id: 1 as never,
        x: 0,
        y: 0,
        radius: 34,
        type: "barren",
        isHomeworld: false,
        owner: null,
        units: 8,
        maxUnits: 80,
        productionRate: 0.2,
        effectiveProductionRate: 0.2,
        shield: 0,
      },
    ];
    cache.generateAll(planets, 99);
    cache.update(100);
    const a = cache.get(0 as never);
    const b = cache.get(1 as never);
    if (typeof HTMLCanvasElement !== "undefined" && !document.createElement("canvas").getContext("webgl2")) {
      expect(a).toBeNull();
      expect(b).toBeNull();
    } else {
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
    }
    cache.clear();
  });
});
