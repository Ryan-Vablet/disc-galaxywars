import type { PlanetId } from "@/types/game";

export interface AIDecision {
  from: PlanetId;
  to: PlanetId;
  delayMs?: number;
}

export interface AttackPlanSource {
  planetId: PlanetId;
  unitsToSend: number;
  estimatedArrivalTime: number;
  delayMs?: number;
}

export interface AttackPlan {
  target: PlanetId;
  sources: AttackPlanSource[];
  totalUnits: number;
  estimatedDefense: number;
  confidence: number;
}

export interface AIPersonality {
  name: string;
  decisionIntervalMs: number;
  aggression: number;
  expansionism: number;
  caution: number;
  minimumSendThreshold: number;
  overpowerRatio: number;
  coordinatedAttacks: boolean;
  staggerArrivals: boolean;
  sunPriority: number;
  homeDefenseRatio: number;
}

export interface PlanetThreatAssessment {
  planetId: PlanetId;
  incomingHostileUnits: number;
  currentUnits: number;
  threatRatio: number;
}
