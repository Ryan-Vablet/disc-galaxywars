import type { Planet, PlanetId } from "@/types/game";
import { assignPlanetType } from "@/planets/PlanetTypes";
import { createThreePlanetRuntime, type ThreePlanetRuntime } from "@/planets/ThreePlanetRuntime";

export interface PlanetTexture {
  image: CanvasImageSource;
  resolution: number;
  typeId: string;
  dominantColor: [number, number, number, number];
}

interface PlanetTextureRuntime extends PlanetTexture {
  runtime: ThreePlanetRuntime;
}

export class PlanetTextureCache {
  private readonly cache = new Map<PlanetId, PlanetTextureRuntime>();

  public generateAll(planets: ReadonlyArray<Planet>, seed: number): void {
    this.cache.clear();
    for (const planet of planets) {
      const type = assignPlanetType(planet, seed);
      const renderSize = Math.max(64, Math.ceil(planet.radius * 2.5));
      const runtime = createThreePlanetRuntime(type.id, renderSize, {
        variationSeed: Number(planet.id) + seed,
      });
      if (!runtime) {
        continue;
      }
      this.cache.set(planet.id, {
        image: runtime.image,
        resolution: renderSize,
        typeId: type.id,
        dominantColor: runtime.dominantColor,
        runtime,
      });
    }
  }

  public get(planetId: PlanetId): PlanetTexture | null {
    return this.cache.get(planetId) ?? null;
  }

  public update(timeMs: number): void {
    const t = timeMs * 0.001;
    for (const entry of this.cache.values()) {
      entry.runtime.update(t);
      entry.image = entry.runtime.image;
    }
  }

  public clear(): void {
    for (const entry of this.cache.values()) {
      entry.runtime.destroy();
    }
    this.cache.clear();
  }
}
