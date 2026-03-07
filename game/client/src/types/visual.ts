import type { PlanetId } from "@/types/game";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}

export interface Trail {
  x: number;
  y: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: "cyan" | "red";
  alpha: number;
}

/** PixelPlanets-style star: position on unit sphere, size/color/opacity (legacy). */
export interface SphereStar {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  opacity: number;
}

/** Flat screen star: 2D position, style (dot/cross/sparkle), color, opacity. Fills the screen. */
export interface FlatStar {
  x: number;
  y: number;
  type: "dot" | "cross" | "sparkle";
  color: string;
  opacity: number;
}

export interface PlanetVisual {
  pulse: number;
  captureFlash: number;
  productionFlash: number;
  colorTransitionMs: number;
  previousOwner: number | null;
}

export interface VisualState {
  particles: Particle[];
  trails: Trail[];
  stars: Star[];
  sphereStars: SphereStar[];
  flatStars: FlatStar[];
  nebulae: Nebula[];
  screenShake: { timeRemainingMs: number; intensity: number };
  planetVisuals: Map<PlanetId, PlanetVisual>;
}
