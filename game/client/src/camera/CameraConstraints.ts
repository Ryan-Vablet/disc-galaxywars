import type { WorldBounds, CameraState } from "./Camera";

/**
 * Camera constraints configuration.
 */
export interface CameraConstraints {
  /** Minimum zoom level (zoomed out). Calculated to fit entire map. */
  minZoom: number;
  /** Maximum zoom level (zoomed in). */
  maxZoom: number;
  /** World-space bounds the camera center cannot leave. */
  worldBounds: WorldBounds;
  /** Padding in world units around the world bounds. */
  boundsPadding: number;
}

/**
 * Create camera constraints based on world bounds and viewport size.
 */
export function createCameraConstraints(
  worldBounds: WorldBounds,
  viewportWidth: number,
  viewportHeight: number,
  options: Partial<Pick<CameraConstraints, "maxZoom" | "boundsPadding">> = {},
): CameraConstraints {
  const maxZoom = options.maxZoom ?? 3.0;
  const boundsPadding = options.boundsPadding ?? 100;

  // Calculate minZoom to fit entire map with 15% padding
  const worldWidth = worldBounds.maxX - worldBounds.minX;
  const worldHeight = worldBounds.maxY - worldBounds.minY;
  const minZoom = Math.min(
    (viewportWidth / worldWidth) * 0.85,
    (viewportHeight / worldHeight) * 0.85,
  );

  return {
    minZoom: Math.max(0.2, minZoom), // Don't go below 0.2x
    maxZoom,
    worldBounds,
    boundsPadding,
  };
}

/**
 * Constrain camera position to stay within world bounds (with padding).
 */
export function constrainPosition(
  state: CameraState,
  constraints: CameraConstraints,
  viewport: { width: number; height: number },
): CameraState {
  const halfViewW = viewport.width / (2 * state.zoom);
  const halfViewH = viewport.height / (2 * state.zoom);
  const bounds = constraints.worldBounds;
  const pad = constraints.boundsPadding;

  return {
    ...state,
    x: clamp(state.x, bounds.minX - pad, bounds.maxX + pad),
    y: clamp(state.y, bounds.minY - pad, bounds.maxY + pad),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Recalculate minZoom when viewport is resized.
 */
export function recalcMinZoom(
  constraints: CameraConstraints,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const worldWidth = constraints.worldBounds.maxX - constraints.worldBounds.minX;
  const worldHeight = constraints.worldBounds.maxY - constraints.worldBounds.minY;
  const minZoom = Math.min(
    (viewportWidth / worldWidth) * 0.85,
    (viewportHeight / worldHeight) * 0.85,
  );
  return Math.max(0.2, minZoom);
}
