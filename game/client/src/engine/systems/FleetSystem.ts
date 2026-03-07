import { GAME_CONSTANTS } from "@/constants/game";
import type { GameEvent, GameState } from "@/types/game";
import { dist } from "@/utils/math";
import { resolveCombat } from "@/engine/systems/CombatResolver";

export class FleetSystem {
  public tick(state: GameState, dtMs: number): GameEvent[] {
    const events: GameEvent[] = [];
    const dtFactor = dtMs / GAME_CONSTANTS.frameDurationMs;

    for (let i = state.fleets.length - 1; i >= 0; i -= 1) {
      const fleet = state.fleets[i];
      if (!fleet) {
        continue;
      }
      const speed = GAME_CONSTANTS.fleetSpeedPerFrame * dtFactor;
      fleet.x += Math.cos(fleet.angle) * speed;
      fleet.y += Math.sin(fleet.angle) * speed;
      fleet.traveled += speed;

      const target = state.planets.find((planet) => planet.id === fleet.toId);
      if (target && dist(fleet, target) < target.radius + 5) {
        const defenderUnitsBefore = target.units;
        const defenderOwnerBefore = target.owner;
        if (target.owner === fleet.owner) {
          target.units += fleet.units;
          events.push({
            type: "fleet_arrived",
            fleet: { ...fleet },
            target: { ...target },
            result: { captured: false, remainingUnits: target.units, damageDealt: 0 },
            defenderUnitsBefore,
            defenderOwnerBefore,
          });
        } else {
          const result = resolveCombat(fleet.units, target.units, target.shield);
          const previousOwner = target.owner;
          target.units = result.remainingUnits;
          if (result.captured) {
            target.owner = fleet.owner;
            events.push({
              type: "planet_captured",
              planet: { ...target },
              newOwner: fleet.owner,
              previousOwner,
            });
          }
          events.push({
            type: "fleet_arrived",
            fleet: { ...fleet },
            target: { ...target },
            result,
            defenderUnitsBefore,
            defenderOwnerBefore,
          });
        }
        state.fleets.splice(i, 1);
        continue;
      }

      if (fleet.traveled > fleet.totalDistance + 100) {
        state.fleets.splice(i, 1);
      }
    }

    return events;
  }
}
