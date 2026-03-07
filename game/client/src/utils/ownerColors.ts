import { COLORS } from "@/constants/visual";
import type { PlayerId } from "@/types/game";

interface OwnerPalette {
  main: string;
  glow: string;
  dark: string;
  trail: string;
}

export function ownerColors(owner: PlayerId | null): OwnerPalette {
  if (owner === null) {
    return COLORS.neutral;
  }
  if (owner === (0 as PlayerId)) {
    return COLORS.player;
  }
  const botIndex = Math.max(0, Number(owner) - 1);
  return COLORS.botPalettes[botIndex % COLORS.botPalettes.length] ?? COLORS.enemy;
}
