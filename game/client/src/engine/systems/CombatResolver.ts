import type { CombatResult } from "@/types/game";

export function resolveCombat(attackerUnits: number, defenderUnits: number, shield = 0): CombatResult {
  const effectiveDamage = attackerUnits * (1 - shield);
  const remaining = defenderUnits - effectiveDamage;
  if (remaining < 0) {
    return { captured: true, remainingUnits: Math.abs(remaining), damageDealt: defenderUnits };
  }
  return { captured: false, remainingUnits: remaining, damageDealt: effectiveDamage };
}
