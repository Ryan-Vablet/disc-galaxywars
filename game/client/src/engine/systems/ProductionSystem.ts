import { SUN_DIVIDEND_MULTIPLIER } from "@/constants/balance";
import { GAME_CONSTANTS } from "@/constants/game";
import type { GameState } from "@/types/game";

export class ProductionSystem {
  public tick(state: GameState, dtMs: number): void {
    const dtSeconds = dtMs / 1000;
    const sunOwner = state.planets.find((planet) => planet.type === "sun")?.owner ?? null;

    for (const planet of state.planets) {
      let rate = planet.productionRate;
      if (planet.owner !== null && sunOwner !== null && planet.owner === sunOwner && planet.type !== "sun") {
        rate *= SUN_DIVIDEND_MULTIPLIER;
      }
      planet.effectiveProductionRate = rate;

      if (planet.owner !== null) {
        planet.units = Math.min(planet.maxUnits, planet.units + rate * dtSeconds);
      }
    }
  }
}
