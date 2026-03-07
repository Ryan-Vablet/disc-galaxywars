import type { DragState, LassoState } from "@/types/input";
import type { GameState, PlanetId } from "@/types/game";
import type { VisualState } from "@/types/visual";
import type { PlanetTextureCache } from "@/planets/PlanetTextureCache";
import type { Camera } from "@/camera/Camera";

export interface RenderContext {
  gameState: Readonly<GameState>;
  visualState: VisualState;
  planetTextures: PlanetTextureCache | null;
  starfieldCanvas: HTMLCanvasElement | null;
  camera: Camera;
  dragState: DragState | null;
  selectedPlanetIds: Set<PlanetId>;
  hoverPlanetId: PlanetId | null;
  hoverPos: { x: number; y: number } | null;
  hoverDurationMs: number;
  paused: boolean;
  lassoState: LassoState | null;
  canvasWidth: number;
  canvasHeight: number;
  timeMs: number;
}

export interface RenderLayer {
  render(ctx: CanvasRenderingContext2D, state: RenderContext): void;
}
