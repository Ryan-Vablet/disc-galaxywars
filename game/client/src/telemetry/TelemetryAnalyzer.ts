import type { TelemetryAnalysis, TelemetrySession } from "@/telemetry/TelemetryTypes";

export class TelemetryAnalyzer {
  public analyze(session: TelemetrySession): TelemetryAnalysis {
    const playerTotals = session.snapshots.map((snapshot) => snapshot.totalUnitsByOwner["0"] ?? 0);
    const enemyTotals = session.snapshots.map((snapshot) =>
      Object.entries(snapshot.totalUnitsByOwner)
        .filter(([key]) => key !== "0" && key !== "neutral")
        .reduce((sum, [, value]) => sum + value, 0),
    );
    const maxLeadRatio = this.getMaxLeadRatio(playerTotals, enemyTotals);
    const longestSunHoldSec = session.sunOwnershipWindows.reduce(
      (best, window) => Math.max(best, window.endSec - window.startSec),
      0,
    );
    const fairnessScore = Math.max(0, 1 - session.metadata.retryCount * 0.1);

    const verdicts = {
      sunBalance:
        session.sunCaptureTimeSec === null
          ? "Sun stayed neutral; no dominant sun swing observed."
          : longestSunHoldSec > 60
            ? "Sun ownership created a sustained advantage window."
            : "Sun changed hands often enough to stay contestable.",
      snowballRisk:
        maxLeadRatio >= 2.25
          ? "High snowball risk detected from economy lead."
          : maxLeadRatio >= 1.5
            ? "Moderate snowballing appeared but remained recoverable."
            : "Economy stayed relatively close throughout the match.",
      mapFairness:
        fairnessScore < 0.5
          ? "Map needed many retries before fairness validation passed."
          : "Map fairness looked stable from retry count and lead reversals.",
      aiCoordination:
        session.coordinatedAttackCount > 0
          ? `AI executed ${session.coordinatedAttackCount} coordinated attack windows.`
          : "No coordinated AI attack bursts were detected.",
      economy:
        session.leadReversals > 1
          ? "Lead changed multiple times, suggesting contested economies."
          : "Economy lead stayed mostly stable once established.",
    };

    return {
      raw: session,
      verdicts,
      summaryLines: [
        `Auto-orient ${session.metadata.autoOrientAngle.toFixed(1)} deg, retries ${session.metadata.retryCount}.`,
        `Sun changes ${session.sunOwnerChanges}, first capture ${this.formatMaybeTime(session.sunCaptureTimeSec)}.`,
        `Lead reversals ${session.leadReversals}, max lead ratio ${maxLeadRatio.toFixed(2)}x.`,
        `AI coordination windows ${session.coordinatedAttackCount}.`,
      ],
    };
  }

  private getMaxLeadRatio(playerTotals: number[], enemyTotals: number[]): number {
    let best = 1;
    for (let i = 0; i < Math.max(playerTotals.length, enemyTotals.length); i += 1) {
      const player = playerTotals[i] ?? 0;
      const enemy = enemyTotals[i] ?? 0;
      const smaller = Math.max(1, Math.min(player, enemy));
      const larger = Math.max(player, enemy, 1);
      best = Math.max(best, larger / smaller);
    }
    return best;
  }

  private formatMaybeTime(timeSec: number | null): string {
    if (timeSec === null) {
      return "never";
    }
    return `${timeSec.toFixed(1)}s`;
  }
}
