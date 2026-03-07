import { describe, expect, it } from "vitest";
import { TelemetryAnalyzer } from "@/telemetry/TelemetryAnalyzer";
import type { TelemetrySession } from "@/telemetry/TelemetryTypes";

describe("TelemetryAnalyzer", () => {
  it("derives readable verdicts from a session", () => {
    const session: TelemetrySession = {
      metadata: {
        mapSize: "large",
        playerCount: 4,
        retryCount: 2,
        autoOrientAngle: -90,
        worldBounds: { minX: 0, minY: 0, maxX: 1800, maxY: 1800 },
      },
      snapshots: [
        {
          timeSec: 0,
          totalUnitsByOwner: { "0": 1000, "1": 900, neutral: 400 },
          planetCountByOwner: { "0": 2, "1": 2, neutral: 4 },
          sunOwner: null,
        },
        {
          timeSec: 10,
          totalUnitsByOwner: { "0": 2400, "1": 1000, neutral: 300 },
          planetCountByOwner: { "0": 4, "1": 2, neutral: 2 },
          sunOwner: 0,
        },
      ],
      totalEvents: 12,
      sunOwnerChanges: 1,
      sunCaptureTimeSec: 8,
      sunOwnershipWindows: [
        { owner: null, startSec: 0, endSec: 8 },
        { owner: 0, startSec: 8, endSec: 70 },
      ],
      coordinatedAttackCount: 3,
      fleetLaunchesByOwner: { "0": 5, "1": 7 },
      planetTypeStats: {
        sun: { captures: 1, currentOwners: { "0": 1 } },
        homeworld: { captures: 0, currentOwners: { "0": 1, "1": 1 } },
        gasGiant: { captures: 1, currentOwners: { "0": 1 } },
        lavaWorld: { captures: 0, currentOwners: { neutral: 1 } },
        terran: { captures: 2, currentOwners: { "0": 2, "1": 1 } },
        iceWorld: { captures: 0, currentOwners: { neutral: 1 } },
        dryTerran: { captures: 0, currentOwners: { neutral: 1 } },
        barren: { captures: 0, currentOwners: { neutral: 1 } },
      },
      leadReversals: 2,
    };

    const analysis = new TelemetryAnalyzer().analyze(session);

    expect(analysis.summaryLines[0]).toContain("Auto-orient");
    expect(analysis.verdicts.aiCoordination).toContain("3");
    expect(analysis.verdicts.sunBalance).toContain("sustained advantage");
    expect(analysis.verdicts.snowballRisk).toContain("High");
  });
});
