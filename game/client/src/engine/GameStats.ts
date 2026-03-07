import type { GameEvent, GameState, PlayerId } from "@/types/game";

export interface SideStats {
  gameDuration: number;
  fleetsLaunched: number;
  fleetsSent: number;
  unitsProduced: number;
  unitsLost: number;
  unitsKilled: number;
  planetsCaptured: number;
  planetsLost: number;
  peakPlanets: number;
  peakUnits: number;
}

function emptyStats(): SideStats {
  return {
    gameDuration: 0,
    fleetsLaunched: 0,
    fleetsSent: 0,
    unitsProduced: 0,
    unitsLost: 0,
    unitsKilled: 0,
    planetsCaptured: 0,
    planetsLost: 0,
    peakPlanets: 0,
    peakUnits: 0,
  };
}

export class GameStatsTracker {
  private readonly statsByPlayer = new Map<PlayerId, SideStats>();

  public constructor(private readonly playerIds: PlayerId[]) {
    for (const id of playerIds) {
      this.statsByPlayer.set(id, emptyStats());
    }
  }

  public updateFrame(state: Readonly<GameState>): void {
    for (const id of this.playerIds) {
      const stats = this.statsByPlayer.get(id);
      if (!stats) {
        continue;
      }
      stats.gameDuration = state.timeMs / 1000;
      const planetCount = state.planets.filter((p) => p.owner === id).length;
      const totalUnits = Math.floor(
        state.planets.filter((p) => p.owner === id).reduce((sum, p) => sum + p.units, 0),
      );
      stats.peakPlanets = Math.max(stats.peakPlanets, planetCount);
      stats.peakUnits = Math.max(stats.peakUnits, totalUnits);
    }
  }

  public recordProduction(owner: PlayerId | null, produced: number): void {
    if (owner === null || produced <= 0) {
      return;
    }
    const stats = this.statsByPlayer.get(owner);
    if (!stats) {
      return;
    }
    stats.unitsProduced += produced;
  }

  public recordEvent(event: GameEvent): void {
    if (event.type === "fleet_launched") {
      const stats = this.statsByPlayer.get(event.fleet.owner);
      if (stats) {
        stats.fleetsLaunched += 1;
        stats.fleetsSent += 1;
      }
      return;
    }

    if (event.type === "fleet_arrived" && event.defenderOwnerBefore !== null && event.defenderOwnerBefore !== event.fleet.owner) {
      const attackerStats = this.statsByPlayer.get(event.fleet.owner);
      const defenderStats = this.statsByPlayer.get(event.defenderOwnerBefore);
      const defendersKilled = Math.min(event.result.damageDealt, event.defenderUnitsBefore);
      const attackersLost = event.result.captured ? 0 : Math.min(event.fleet.units, event.defenderUnitsBefore);
      if (attackerStats) {
        attackerStats.unitsKilled += defendersKilled;
        attackerStats.unitsLost += attackersLost;
      }
      if (defenderStats) {
        defenderStats.unitsKilled += attackersLost;
        defenderStats.unitsLost += defendersKilled;
      }
      return;
    }

    if (event.type === "planet_captured") {
      const winnerStats = this.statsByPlayer.get(event.newOwner);
      if (winnerStats) {
        winnerStats.planetsCaptured += 1;
      }
      if (event.previousOwner !== null) {
        const loserStats = this.statsByPlayer.get(event.previousOwner);
        if (loserStats) {
          loserStats.planetsLost += 1;
        }
      }
    }
  }

  public getStatsFor(playerId: PlayerId): Readonly<SideStats> {
    return this.statsByPlayer.get(playerId) ?? emptyStats();
  }
}
