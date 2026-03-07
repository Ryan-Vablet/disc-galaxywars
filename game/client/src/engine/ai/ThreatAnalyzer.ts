import type { PlanetId, PlayerId, GameState } from "@/types/game";
import type { PlanetThreatAssessment } from "@/types/ai";

export class ThreatAnalyzer {
  public getIncomingThreats(planetId: PlanetId, state: Readonly<GameState>, forPlayer: PlayerId): number {
    return state.fleets
      .filter((fleet) => fleet.toId === planetId && fleet.owner !== forPlayer)
      .reduce((sum, fleet) => sum + fleet.units, 0);
  }

  public getVulnerablePlanets(
    state: Readonly<GameState>,
    forPlayer: PlayerId,
  ): PlanetThreatAssessment[] {
    const myPlanets = state.planets.filter((planet) => planet.owner === forPlayer);
    const assessments = myPlanets.map((planet) => {
      const incomingHostileUnits = this.getIncomingThreats(planet.id, state, forPlayer);
      const threatRatio = incomingHostileUnits / Math.max(planet.units, 1);
      return {
        planetId: planet.id,
        incomingHostileUnits,
        currentUnits: planet.units,
        threatRatio,
      };
    });
    return assessments.sort((a, b) => b.threatRatio - a.threatRatio);
  }
}
