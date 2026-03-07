import { GAME_CONSTANTS } from "@/constants/game";
import type { AIDecision, AIPersonality, AttackPlan, AttackPlanSource } from "@/types/ai";
import type { GameState, Planet, PlayerId } from "@/types/game";
import { dist } from "@/utils/math";
import { ThreatAnalyzer } from "@/engine/ai/ThreatAnalyzer";

export class BotAI {
  private readonly personality: AIPersonality;
  private readonly playerId: PlayerId;
  private readonly threatAnalyzer: ThreatAnalyzer;
  private timerMs = 0;

  public constructor(playerId: PlayerId, personality: AIPersonality) {
    this.playerId = playerId;
    this.personality = personality;
    this.threatAnalyzer = new ThreatAnalyzer();
  }

  public evaluate(state: Readonly<GameState>, dtMs: number): AIDecision[] {
    this.timerMs += dtMs;
    if (this.timerMs < this.personality.decisionIntervalMs) {
      return [];
    }
    this.timerMs = 0;

    const myPlanets = state.planets.filter((p) => p.owner === this.playerId);
    const targets = state.planets.filter((p) => p.owner !== this.playerId);
    if (myPlanets.length === 0 || targets.length === 0) {
      return [];
    }

    if (this.personality.coordinatedAttacks) {
      const plans = this.scoreTargets(state)
        .slice(0, 3)
        .map((target) => this.buildAttackPlan(target.id, state))
        .filter((plan): plan is AttackPlan => plan !== null)
        .filter((plan) => plan.confidence >= this.personality.overpowerRatio);

      const bestPlan = this.selectBestPlan(plans);
      if (bestPlan) {
        const finalPlan = this.personality.staggerArrivals ? this.staggerSends(bestPlan) : bestPlan;
        return finalPlan.sources.map((source) => ({
          from: source.planetId,
          to: finalPlan.target,
          delayMs: source.delayMs,
        }));
      }
    }

    const fallback = this.fallbackSingleSend(state);
    return fallback ? [fallback] : [];
  }

  private scoreTargets(state: Readonly<GameState>): Planet[] {
    const ownedPlanets = state.planets.filter((planet) => planet.owner === this.playerId);
    return state.planets
      .filter((planet) => planet.owner !== this.playerId)
      .sort((a, b) => this.scorePlanetValue(b, ownedPlanets) - this.scorePlanetValue(a, ownedPlanets));
  }

  private scorePlanetValue(planet: Planet, ownedPlanets: Planet[]): number {
    let score = 0;
    const typeScores: Record<string, number> = {
      sun: 100,
      homeworld: 80,
      gasGiant: 30,
      lavaWorld: 60,
      terran: 45,
      iceWorld: 35,
      dryTerran: 20,
      barren: 10,
    };
    score += typeScores[planet.type] ?? 20;

    if (planet.owner !== null && planet.owner !== this.playerId) {
      score += 15;
      if (planet.type === "homeworld") {
        score += 30;
      }
    }

    if (planet.type === "sun" && planet.owner !== this.playerId) {
      score += 25 * this.personality.sunPriority;
    }

    if (planet.type === "gasGiant") {
      const myTotalProd = ownedPlanets.reduce((sum, owned) => sum + owned.productionRate, 0);
      if (myTotalProd < 150) {
        score -= 20;
      }
    }

    const nearestOwned = ownedPlanets.reduce((min, owned) => Math.min(min, dist(owned, planet)), Infinity);
    score -= nearestOwned * 0.05;

    const effectiveDefense = planet.units * (1 / Math.max(1 - planet.shield, 0.01));
    score -= effectiveDefense * 0.001;
    return score;
  }

  private buildAttackPlan(targetId: Planet["id"], state: Readonly<GameState>): AttackPlan | null {
    const target = state.planets.find((planet) => planet.id === targetId);
    if (!target) {
      return null;
    }

    const baseDefense = target.units;
    const shieldMultiplier = 1 / Math.max(1 - target.shield, 0.01);
    const myPlanets = state.planets
      .filter((planet) => planet.owner === this.playerId)
      .map((planet) => {
        const distance = dist(planet, target);
        const available = Math.floor(planet.units * GAME_CONSTANTS.sendRatio);
        return { planet, distance, available };
      })
      .filter((entry) => entry.available >= this.personality.minimumSendThreshold)
      .sort((a, b) => a.distance - b.distance);

    const sources: AttackPlanSource[] = [];
    let totalUnits = 0;
    let longestArrivalTime = 0;

    for (const source of myPlanets) {
      if (source.planet.type === "homeworld" && source.planet.units < source.planet.maxUnits * this.personality.homeDefenseRatio) {
        continue;
      }

      const incomingThreats = this.threatAnalyzer.getIncomingThreats(source.planet.id, state, this.playerId);
      if (incomingThreats > source.planet.units * 0.5) {
        continue;
      }

      const estimatedArrivalTime = source.distance / this.fleetSpeedPerSecond();
      longestArrivalTime = Math.max(longestArrivalTime, estimatedArrivalTime);
      const projectedDefense =
        target.owner !== null ? baseDefense + target.productionRate * estimatedArrivalTime : baseDefense;
      const effectiveDefense = projectedDefense * shieldMultiplier;

      sources.push({
        planetId: source.planet.id,
        unitsToSend: source.available,
        estimatedArrivalTime,
      });
      totalUnits += source.available;

      if (totalUnits >= effectiveDefense * this.personality.overpowerRatio) {
        return {
          target: targetId,
          sources,
          totalUnits,
          estimatedDefense: effectiveDefense,
          confidence: totalUnits / Math.max(effectiveDefense, 1),
        };
      }
    }

    const fallbackDefense = baseDefense * shieldMultiplier;
    if (totalUnits < fallbackDefense) {
      return null;
    }
    return {
      target: targetId,
      sources,
      totalUnits,
      estimatedDefense: fallbackDefense,
      confidence: totalUnits / Math.max(fallbackDefense, 1),
    };
  }

  private selectBestPlan(plans: AttackPlan[]): AttackPlan | null {
    if (plans.length === 0) {
      return null;
    }
    return plans.reduce((best, plan) => {
      const bestScore = best.confidence * 100 - best.estimatedDefense * 0.001;
      const planScore = plan.confidence * 100 - plan.estimatedDefense * 0.001;
      return planScore > bestScore ? plan : best;
    });
  }

  private staggerSends(plan: AttackPlan): AttackPlan {
    const maxArrival = Math.max(...plan.sources.map((source) => source.estimatedArrivalTime));
    return {
      ...plan,
      sources: plan.sources.map((source) => ({
        ...source,
        delayMs: Math.max(0, (maxArrival - source.estimatedArrivalTime) * 1000),
      })),
    };
  }

  private fallbackSingleSend(state: Readonly<GameState>): AIDecision | null {
    const vulnerable = this.threatAnalyzer.getVulnerablePlanets(state, this.playerId);
    const threatenedIds = new Set(
      vulnerable.filter((entry) => entry.threatRatio > 0.6).map((entry) => entry.planetId),
    );

    let bestScore = -Infinity;
    let bestFrom: Planet | null = null;
    let bestTo: Planet | null = null;

    for (const from of state.planets.filter((planet) => planet.owner === this.playerId)) {
      const available = Math.floor(from.units * GAME_CONSTANTS.sendRatio);
      if (available < this.personality.minimumSendThreshold) {
        continue;
      }

      for (const to of state.planets.filter((planet) => planet.owner !== this.playerId)) {
        const distance = dist(from, to);
        const travelTime = distance / this.fleetSpeedPerSecond();
        const futureUnits =
          to.owner === null ? to.units : to.units + to.productionRate * travelTime;
        const effectiveDefense = futureUnits * (1 / Math.max(1 - to.shield, 0.01));
        const needed = effectiveDefense * this.personality.overpowerRatio + 2;
        if (available < needed * 0.7) {
          continue;
        }

        let score = 0;
        score += (available - needed) * 3;
        score -= distance * 0.15;
        score += this.scorePlanetValue(to, state.planets.filter((planet) => planet.owner === this.playerId));
        score += to.owner === null ? 18 * this.personality.expansionism : -6 * this.personality.caution;
        if (to.owner === (0 as PlayerId)) {
          score += 14 * this.personality.aggression;
        }
        if (threatenedIds.has(from.id)) {
          score -= 40;
        }

        if (score > bestScore) {
          bestScore = score;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestFrom && bestTo && bestScore > -20) {
      return { from: bestFrom.id, to: bestTo.id };
    }
    return null;
  }

  private fleetSpeedPerSecond(): number {
    return GAME_CONSTANTS.fleetSpeedPerFrame * (1000 / GAME_CONSTANTS.frameDurationMs);
  }
}
