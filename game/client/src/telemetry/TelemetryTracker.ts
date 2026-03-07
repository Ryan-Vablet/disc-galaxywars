import type { GameEvent, GameState, PlanetGameplayType } from "@/types/game";
import type {
  EconomySnapshot,
  PlanetTypeTelemetry,
  TelemetrySession,
  TelemetryStartupMetadata,
} from "@/telemetry/TelemetryTypes";
import { ownerKey } from "@/telemetry/TelemetryTypes";

const SNAPSHOT_INTERVAL_MS = 10_000;
const COORDINATED_ATTACK_WINDOW_MS = 1_500;

type LaunchSample = {
  timeMs: number;
  toId: number;
  fromId: number;
};

export class TelemetryTracker {
  private metadata: TelemetryStartupMetadata | null = null;
  private snapshots: EconomySnapshot[] = [];
  private totalEvents = 0;
  private nextSnapshotAtMs = 0;
  private finalized = false;
  private sunOwnerChanges = 0;
  private sunCaptureTimeSec: number | null = null;
  private leadReversals = 0;
  private lastLeaderKey: string | null = null;
  private readonly sunOwnershipWindows: TelemetrySession["sunOwnershipWindows"] = [];
  private activeSunWindowOwner: number | null = null;
  private activeSunWindowStartSec = 0;
  private coordinatedAttackCount = 0;
  private readonly fleetLaunchesByOwner: Record<string, number> = {};
  private readonly recentLaunchesByOwner = new Map<string, LaunchSample[]>();
  private readonly planetTypeStats: Record<PlanetGameplayType, PlanetTypeTelemetry> = {
    sun: { captures: 0, currentOwners: {} },
    homeworld: { captures: 0, currentOwners: {} },
    gasGiant: { captures: 0, currentOwners: {} },
    lavaWorld: { captures: 0, currentOwners: {} },
    terran: { captures: 0, currentOwners: {} },
    iceWorld: { captures: 0, currentOwners: {} },
    dryTerran: { captures: 0, currentOwners: {} },
    barren: { captures: 0, currentOwners: {} },
  };

  public configure(metadata: TelemetryStartupMetadata, initialState: Readonly<GameState>): void {
    this.metadata = metadata;
    this.snapshots = [];
    this.totalEvents = 0;
    this.nextSnapshotAtMs = 0;
    this.finalized = false;
    this.sunOwnerChanges = 0;
    this.sunCaptureTimeSec = null;
    this.leadReversals = 0;
    this.lastLeaderKey = null;
    this.sunOwnershipWindows.length = 0;
    this.coordinatedAttackCount = 0;
    for (const key of Object.keys(this.fleetLaunchesByOwner)) {
      delete this.fleetLaunchesByOwner[key];
    }
    this.recentLaunchesByOwner.clear();
    for (const type of Object.keys(this.planetTypeStats) as PlanetGameplayType[]) {
      this.planetTypeStats[type] = { captures: 0, currentOwners: {} };
    }
    this.capturePlanetOwnerSnapshot(initialState);
    const sun = initialState.planets.find((planet) => planet.isSun);
    this.activeSunWindowOwner = sun?.owner ?? null;
    this.activeSunWindowStartSec = 0;
    this.tick(initialState);
  }

  public recordEvent(event: GameEvent, state: Readonly<GameState>): void {
    this.totalEvents += 1;
    if (event.type === "fleet_launched") {
      const key = ownerKey(event.fleet.owner);
      this.fleetLaunchesByOwner[key] = (this.fleetLaunchesByOwner[key] ?? 0) + 1;
      const launches = this.recentLaunchesByOwner.get(key) ?? [];
      const now = state.timeMs;
      const relevant = launches.filter((sample) => now - sample.timeMs <= COORDINATED_ATTACK_WINDOW_MS);
      if (relevant.some((sample) => sample.toId === Number(event.fleet.toId) && sample.fromId !== Number(event.fleet.fromId))) {
        this.coordinatedAttackCount += 1;
      }
      relevant.push({
        timeMs: now,
        toId: Number(event.fleet.toId),
        fromId: Number(event.fleet.fromId),
      });
      this.recentLaunchesByOwner.set(key, relevant);
      return;
    }

    if (event.type === "planet_captured") {
      this.planetTypeStats[event.planet.type].captures += 1;
      if (event.planet.isSun) {
        this.sunOwnerChanges += 1;
        if (this.sunCaptureTimeSec === null) {
          this.sunCaptureTimeSec = state.timeMs / 1000;
        }
        this.closeSunWindow(state.timeMs / 1000);
        this.activeSunWindowOwner = Number(event.newOwner);
        this.activeSunWindowStartSec = state.timeMs / 1000;
      }
    }
  }

  public tick(state: Readonly<GameState>): void {
    if (!this.metadata || this.finalized) {
      return;
    }
    while (state.timeMs >= this.nextSnapshotAtMs) {
      this.snapshots.push(this.buildSnapshot(state, this.nextSnapshotAtMs / 1000));
      this.nextSnapshotAtMs += SNAPSHOT_INTERVAL_MS;
    }
    const leaderKey = this.getLeaderKey(state);
    if (leaderKey !== this.lastLeaderKey) {
      if (this.lastLeaderKey !== null) {
        this.leadReversals += 1;
      }
      this.lastLeaderKey = leaderKey;
    }
    this.capturePlanetOwnerSnapshot(state);
  }

  public finalize(state: Readonly<GameState>): TelemetrySession {
    if (!this.metadata) {
      throw new Error("TelemetryTracker configured before finalize");
    }
    if (!this.finalized) {
      this.tick(state);
      this.closeSunWindow(state.timeMs / 1000);
      this.finalized = true;
    }
    return {
      metadata: this.metadata,
      snapshots: [...this.snapshots],
      totalEvents: this.totalEvents,
      sunOwnerChanges: this.sunOwnerChanges,
      sunCaptureTimeSec: this.sunCaptureTimeSec,
      sunOwnershipWindows: [...this.sunOwnershipWindows],
      coordinatedAttackCount: this.coordinatedAttackCount,
      fleetLaunchesByOwner: { ...this.fleetLaunchesByOwner },
      planetTypeStats: structuredClone(this.planetTypeStats),
      leadReversals: Math.max(0, this.leadReversals - 1),
    };
  }

  private buildSnapshot(state: Readonly<GameState>, timeSec: number): EconomySnapshot {
    const totalUnitsByOwner: Record<string, number> = {};
    const planetCountByOwner: Record<string, number> = {};
    for (const planet of state.planets) {
      const key = ownerKey(planet.owner);
      totalUnitsByOwner[key] = (totalUnitsByOwner[key] ?? 0) + planet.units;
      planetCountByOwner[key] = (planetCountByOwner[key] ?? 0) + 1;
    }
    for (const fleet of state.fleets) {
      const key = ownerKey(fleet.owner);
      totalUnitsByOwner[key] = (totalUnitsByOwner[key] ?? 0) + fleet.units;
    }
    const sunOwner = state.planets.find((planet) => planet.isSun)?.owner ?? null;
    return {
      timeSec,
      totalUnitsByOwner,
      planetCountByOwner,
      sunOwner: sunOwner === null ? null : Number(sunOwner),
    };
  }

  private getLeaderKey(state: Readonly<GameState>): string | null {
    const totals = this.buildSnapshot(state, state.timeMs / 1000).totalUnitsByOwner;
    let bestKey: string | null = null;
    let bestValue = -Infinity;
    for (const [key, value] of Object.entries(totals)) {
      if (key === "neutral") {
        continue;
      }
      if (value > bestValue) {
        bestValue = value;
        bestKey = key;
      }
    }
    return bestKey;
  }

  private closeSunWindow(endSec: number): void {
    this.sunOwnershipWindows.push({
      owner: this.activeSunWindowOwner,
      startSec: this.activeSunWindowStartSec,
      endSec,
    });
  }

  private capturePlanetOwnerSnapshot(state: Readonly<GameState>): void {
    for (const type of Object.keys(this.planetTypeStats) as PlanetGameplayType[]) {
      this.planetTypeStats[type].currentOwners = {};
    }
    for (const planet of state.planets) {
      const key = ownerKey(planet.owner);
      const bucket = this.planetTypeStats[planet.type].currentOwners;
      bucket[key] = (bucket[key] ?? 0) + 1;
    }
  }
}
