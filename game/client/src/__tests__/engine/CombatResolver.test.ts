import { describe, expect, it } from "vitest";
import { resolveCombat } from "@/engine/systems/CombatResolver";

describe("CombatResolver", () => {
  it("captures when attackers exceed defenders", () => {
    const result = resolveCombat(20, 15);
    expect(result.captured).toBe(true);
    expect(result.remainingUnits).toBe(5);
    expect(result.damageDealt).toBe(15);
  });

  it("does not capture when defenders hold", () => {
    const result = resolveCombat(10, 15);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(5);
    expect(result.damageDealt).toBe(10);
  });

  it("defender advantage on exact tie", () => {
    const result = resolveCombat(15, 15);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(0);
    expect(result.damageDealt).toBe(15);
  });

  it("applies 50% shield without capturing", () => {
    const result = resolveCombat(1000, 600, 0.5);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(100);
    expect(result.damageDealt).toBe(500);
  });

  it("applies 50% shield and captures with overflow", () => {
    const result = resolveCombat(1400, 600, 0.5);
    expect(result.captured).toBe(true);
    expect(result.remainingUnits).toBe(100);
    expect(result.damageDealt).toBe(600);
  });

  it("matches legacy behavior with zero shield", () => {
    const result = resolveCombat(10, 15, 0);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(5);
    expect(result.damageDealt).toBe(10);
  });

  it("does not capture on exact shield-adjusted threshold", () => {
    const result = resolveCombat(1200, 600, 0.5);
    expect(result.captured).toBe(false);
    expect(result.remainingUnits).toBe(0);
    expect(result.damageDealt).toBe(600);
  });
});
