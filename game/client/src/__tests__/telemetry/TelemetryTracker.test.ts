import { describe, expect, it } from "vitest";
import { TelemetryTracker } from "@/telemetry/TelemetryTracker";
import type { GameEvent, GameState, Planet, PlayerId } from "@/types/game";

function makePlanet(overrides: Partial<Planet>): Planet {
  return {
    id: 1 as Planet["id"],
    x: 0,
    y: 0,
    radius: 40,
    type: "terran",
    isHomeworld: false,
    owner: null,
    units: 100,
    maxUnits: 300,
    productionRate: 10,
    effectiveProductionRate: 10,
    shield: 0,
    ...overrides,
  };
}

function makeState(timeMs: number): GameState {
  return {
    planets: [
      makePlanet({ id: 1 as Planet["id"], type: "sun", isSun: true, owner: null }),
      makePlanet({ id: 2 as Planet["id"], type: "homeworld", isHomeworld: true, owner: 0 as PlayerId, x: -200 }),
      makePlanet({ id: 3 as Planet["id"], type: "homeworld", isHomeworld: true, owner: 1 as PlayerId, x: 200 }),
      makePlanet({ id: 4 as Planet["id"], type: "terran", owner: 0 as PlayerId, x: -100 }),
      makePlanet({ id: 5 as Planet["id"], type: "terran", owner: 1 as PlayerId, x: 100 }),
    ],
    fleets: [],
    players: [
      { id: 0 as PlayerId, name: "You", isBot: false },
      { id: 1 as PlayerId, name: "Bot 1", isBot: true },
    ],
    status: "playing",
    winner: null,
    timeMs,
  };
}

describe("TelemetryTracker", () => {
  it("tracks snapshots, coordinated launches, and sun capture metadata", () => {
    const tracker = new TelemetryTracker();
    const initialState = makeState(0);
    tracker.configure(
      {
        mapSize: "medium",
        playerCount: 2,
        retryCount: 1,
        autoOrientAngle: 90,
        worldBounds: { minX: -300, minY: -300, maxX: 300, maxY: 300 },
      },
      initialState,
    );

    const launchA: GameEvent = {
      type: "fleet_launched",
      fleet: {
        id: 1 as never,
        fromId: 4 as never,
        toId: 1 as never,
        owner: 1 as PlayerId,
        units: 50,
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        angle: 0,
        totalDistance: 1,
        traveled: 0,
      },
      from: initialState.planets[4]!,
    };
    const launchB: GameEvent = {
      ...launchA,
      fleet: { ...launchA.fleet, id: 2 as never, fromId: 3 as never },
    };
    tracker.recordEvent(launchA, makeState(1_000));
    tracker.recordEvent(launchB, makeState(1_900));

    const postCaptureState = makeState(12_000);
    postCaptureState.planets[0] = makePlanet({
      id: 1 as Planet["id"],
      type: "sun",
      isSun: true,
      owner: 1 as PlayerId,
      units: 40,
    });
    tracker.tick(postCaptureState);
    tracker.recordEvent(
      {
        type: "planet_captured",
        planet: postCaptureState.planets[0]!,
        newOwner: 1 as PlayerId,
        previousOwner: null,
      },
      postCaptureState,
    );

    const session = tracker.finalize(postCaptureState);

    expect(session.snapshots.length).toBeGreaterThanOrEqual(2);
    expect(session.coordinatedAttackCount).toBe(1);
    expect(session.sunOwnerChanges).toBe(1);
    expect(session.sunCaptureTimeSec).toBe(12);
    expect(session.fleetLaunchesByOwner["1"]).toBe(2);
  });
});
