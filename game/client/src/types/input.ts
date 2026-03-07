import type { PlanetId } from "@/types/game";

export interface Vec2 {
  x: number;
  y: number;
}

export interface DragState {
  fromPlanetIds: PlanetId[];
  current: Vec2;
}

export interface LassoState {
  startScreen: Vec2;      // Screen coordinates where drag started
  currentScreen: Vec2;    // Current mouse position in screen coordinates
  startWorld: Vec2;       // World coordinates for planet hit testing
  currentWorld: Vec2;     // Current world coordinates
}

export type BoxSelectionState = LassoState;

export interface InputCallbacks {
  onFleetDispatch: (fromIds: PlanetId[], to: PlanetId) => void;
  getPlanetAt: (pos: Vec2) => PlanetId | null;
  isOwnedByPlayer: (planetId: PlanetId) => boolean;
  /**
   * Get all player-owned planets within a world-space bounding box.
   * Used for box selection functionality.
   */
  getPlanetsInBox: (minX: number, minY: number, maxX: number, maxY: number) => PlanetId[];
  /**
   * Get all planet IDs owned by the player.
   * Used for select all functionality.
   */
  getAllOwnedPlanetIds: () => PlanetId[];
  /**
   * Convert screen coordinates to world coordinates.
   * Used for hit testing planets after camera transform.
   */
  screenToWorld: (screenX: number, screenY: number) => Vec2;
}
