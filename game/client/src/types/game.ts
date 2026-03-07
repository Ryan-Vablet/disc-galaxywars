export type PlanetId = number & { readonly __brand: "PlanetId" };
export type PlayerId = number & { readonly __brand: "PlayerId" };
export type FleetId = number & { readonly __brand: "FleetId" };
export type PlanetGameplayType =
  | "sun"
  | "homeworld"
  | "gasGiant"
  | "lavaWorld"
  | "terran"
  | "iceWorld"
  | "dryTerran"
  | "barren";

export type GameStatus = "playing" | "victory" | "defeat";

export interface Planet {
  id: PlanetId;
  x: number;
  y: number;
  radius: number;
  type: PlanetGameplayType;
  isHomeworld: boolean;
  owner: PlayerId | null;
  units: number;
  maxUnits: number;
  productionRate: number;
  effectiveProductionRate: number;
  shield: number;
  /** When true, this is the center sun: star visual, shield (half damage taken). */
  isSun?: boolean;
}

export interface Fleet {
  id: FleetId;
  fromId: PlanetId;
  toId: PlanetId;
  owner: PlayerId;
  units: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  angle: number;
  totalDistance: number;
  traveled: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  isBot: boolean;
}

export interface GameState {
  planets: Planet[];
  fleets: Fleet[];
  players: Player[];
  status: GameStatus;
  winner: PlayerId | null;
  timeMs: number;
}

export interface GameConfig {
  width: number;
  height: number;
  playerId: PlayerId;
  botCount: number;
  mapSize: "small" | "medium" | "large";
  homeUnits: number;
}

export interface CombatResult {
  captured: boolean;
  remainingUnits: number;
  damageDealt: number;
}

export type DispatchError =
  | "invalid_source"
  | "invalid_target"
  | "same_planet"
  | "not_owner"
  | "insufficient_units";

export interface FleetDispatchResult {
  ok: boolean;
  fleet?: Fleet;
  sentUnits?: number;
  error?: DispatchError;
}

export type GameEvent =
  | { type: "fleet_launched"; fleet: Fleet; from: Planet }
  | {
      type: "fleet_arrived";
      fleet: Fleet;
      target: Planet;
      result: CombatResult;
      defenderUnitsBefore: number;
      defenderOwnerBefore: PlayerId | null;
    }
  | {
      type: "planet_captured";
      planet: Planet;
      newOwner: PlayerId;
      previousOwner: PlayerId | null;
    }
  | { type: "game_over"; winner: PlayerId };
