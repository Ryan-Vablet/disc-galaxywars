import { GAME_CONSTANTS } from "@/constants/game";
import type { Fleet, FleetDispatchResult, FleetId, GameState, PlanetId, PlayerId } from "@/types/game";
import { dist } from "@/utils/math";

export interface FleetDispatchContext {
  nextFleetId: () => FleetId;
}

export class FleetDispatcher {
  private readonly context: FleetDispatchContext;

  public constructor(context: FleetDispatchContext) {
    this.context = context;
  }

  public dispatch(
    state: GameState,
    fromId: PlanetId,
    toId: PlanetId,
    owner: PlayerId,
  ): FleetDispatchResult {
    const from = state.planets.find((planet) => planet.id === fromId);
    const to = state.planets.find((planet) => planet.id === toId);
    if (!from) {
      return { ok: false, error: "invalid_source" };
    }
    if (!to) {
      return { ok: false, error: "invalid_target" };
    }
    if (from.id === to.id) {
      return { ok: false, error: "same_planet" };
    }
    if (from.owner !== owner) {
      return { ok: false, error: "not_owner" };
    }

    const sendUnits = Math.floor(from.units * GAME_CONSTANTS.sendRatio);
    if (sendUnits < 1) {
      return { ok: false, error: "insufficient_units" };
    }
    from.units -= sendUnits;

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const totalDistance = dist(from, to);
    const fleet: Fleet = {
      id: this.context.nextFleetId(),
      fromId,
      toId,
      owner,
      units: sendUnits,
      x: from.x,
      y: from.y,
      tx: to.x,
      ty: to.y,
      angle,
      totalDistance,
      traveled: 0,
    };
    state.fleets.push(fleet);
    return { ok: true, fleet, sentUnits: sendUnits };
  }
}
