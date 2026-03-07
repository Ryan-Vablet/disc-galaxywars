import type { GameConfig, GameEvent, GameState, PlanetGameplayType, PlayerId } from "@/types/game";
import type { WorldBounds } from "@/camera/Camera";

export interface TelemetryStartupMetadata {
  mapSize: GameConfig["mapSize"];
  playerCount: number;
  retryCount: number;
  autoOrientAngle: number;
  worldBounds: WorldBounds;
}

export interface EconomySnapshot {
  timeSec: number;
  totalUnitsByOwner: Record<string, number>;
  planetCountByOwner: Record<string, number>;
  sunOwner: number | null;
}

export interface SunOwnershipWindow {
  owner: number | null;
  startSec: number;
  endSec: number;
}

export interface PlanetTypeTelemetry {
  captures: number;
  currentOwners: Record<string, number>;
}

export interface TelemetrySession {
  metadata: TelemetryStartupMetadata;
  snapshots: EconomySnapshot[];
  totalEvents: number;
  sunOwnerChanges: number;
  sunCaptureTimeSec: number | null;
  sunOwnershipWindows: SunOwnershipWindow[];
  coordinatedAttackCount: number;
  fleetLaunchesByOwner: Record<string, number>;
  planetTypeStats: Record<PlanetGameplayType, PlanetTypeTelemetry>;
  leadReversals: number;
}

export interface TelemetryAnalysis {
  raw: TelemetrySession;
  summaryLines: string[];
  verdicts: {
    sunBalance: string;
    snowballRisk: string;
    mapFairness: string;
    aiCoordination: string;
    economy: string;
  };
}

export interface TelemetryTrackerLike {
  configure(metadata: TelemetryStartupMetadata, initialState: Readonly<GameState>): void;
  recordEvent(event: GameEvent, state: Readonly<GameState>): void;
  tick(state: Readonly<GameState>): void;
  finalize(state: Readonly<GameState>): TelemetrySession;
}

export function ownerKey(owner: PlayerId | null): string {
  return owner === null ? "neutral" : String(owner);
}
