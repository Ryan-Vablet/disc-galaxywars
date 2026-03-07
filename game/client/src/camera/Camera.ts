/**
 * World-space bounds for camera constraints and frustum culling.
 */
export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Camera state - position in world coordinates and zoom level.
 */
export interface CameraState {
  /** Camera center position in world coordinates. */
  x: number;
  /** Camera center position in world coordinates. */
  y: number;
  /**
   * Zoom level.
   * 1.0 = default fit-all view.
   * >1 = zoomed in.
   * <1 = zoomed out.
   */
  zoom: number;
  /** Camera rotation in degrees. */
  rotation: number;
}

/**
 * Camera class for world-space to screen-space coordinate transformation.
 *
 * The camera provides smooth interpolation for buttery movement and supports
 * zoom toward a specific screen point (critical for good UX).
 *
 * Transform math:
 * - screenX = (worldX - camera.x) * zoom + viewportWidth / 2
 * - screenY = (worldY - camera.y) * zoom + viewportHeight / 2
 */
export class Camera {
  private state: CameraState;
  private targetState: CameraState;
  private viewportWidth: number;
  private viewportHeight: number;
  private pivotX = 0;
  private pivotY = 0;
  public minZoom: number;
  public maxZoom: number;

  public constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
    this.state = { x: 0, y: 0, zoom: 1.0, rotation: 0 };
    this.targetState = { x: 0, y: 0, zoom: 1.0, rotation: 0 };
  }

  /**
   * Convert world coordinates to screen (canvas pixel) coordinates.
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return this.worldToScreenWithState(this.state, worldX, worldY);
  }

  private worldToScreenWithState(state: Readonly<CameraState>, worldX: number, worldY: number): { x: number; y: number } {
    const radians = toRadians(state.rotation);
    const dx = worldX - this.pivotX;
    const dy = worldY - this.pivotY;
    const rotatedX = dx * Math.cos(radians) - dy * Math.sin(radians);
    const rotatedY = dx * Math.sin(radians) + dy * Math.cos(radians);
    return {
      x: (rotatedX + (this.pivotX - state.x)) * state.zoom + this.viewportWidth / 2,
      y: (rotatedY + (this.pivotY - state.y)) * state.zoom + this.viewportHeight / 2,
    };
  }

  /**
   * Convert screen coordinates to world coordinates.
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return this.screenToWorldWithState(this.state, screenX, screenY);
  }

  private screenToWorldWithState(
    state: Readonly<CameraState>,
    screenX: number,
    screenY: number,
  ): { x: number; y: number } {
    const radians = toRadians(state.rotation);
    const ux = (screenX - this.viewportWidth / 2) / state.zoom - (this.pivotX - state.x);
    const uy = (screenY - this.viewportHeight / 2) / state.zoom - (this.pivotY - state.y);
    return {
      x: this.pivotX + ux * Math.cos(radians) + uy * Math.sin(radians),
      y: this.pivotY - ux * Math.sin(radians) + uy * Math.cos(radians),
    };
  }

  /**
   * Convert a world-space distance/radius to screen-space pixels.
   * Used for planet radii, fleet sizes, etc.
   */
  public worldToScreenScale(worldDistance: number): number {
    return worldDistance * this.state.zoom;
  }

  /**
   * Apply the camera transform to a canvas context.
   * Call this before rendering world-space layers.
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    ctx.scale(this.state.zoom, this.state.zoom);
    ctx.translate(this.pivotX - this.state.x, this.pivotY - this.state.y);
    ctx.rotate(toRadians(this.state.rotation));
    ctx.translate(-this.pivotX, -this.pivotY);
  }

  /**
   * Reset the canvas context transform.
   * Call this before rendering screen-space layers (HUD, overlays).
   */
  public resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Pan the camera by a screen-space delta.
   */
  public pan(screenDeltaX: number, screenDeltaY: number): void {
    const worldDeltaX = screenDeltaX / this.state.zoom;
    const worldDeltaY = screenDeltaY / this.state.zoom;
    this.targetState.x -= worldDeltaX;
    this.targetState.y -= worldDeltaY;
  }

  /**
   * Zoom toward a screen-space point.
   * The world point under the cursor stays fixed on screen.
   */
  public zoomAt(screenX: number, screenY: number, zoomDelta: number): void {
    const worldBefore = this.screenToWorldWithState(this.targetState, screenX, screenY);

    this.targetState.zoom = clamp(
      this.targetState.zoom * (1 + zoomDelta),
      this.minZoom,
      this.maxZoom,
    );

    const worldAfter = this.screenToWorldWithState(this.targetState, screenX, screenY);

    this.targetState.x += worldBefore.x - worldAfter.x;
    this.targetState.y += worldBefore.y - worldAfter.y;
  }

  /**
   * Set zoom level directly (for slider).
   * Updates both state and targetState for immediate effect.
   */
  public setZoom(zoom: number): void {
    const clamped = clamp(zoom, this.minZoom, this.maxZoom);
    this.state.zoom = clamped;
    this.targetState.zoom = clamped;
  }

  /**
   * Set camera position directly.
   * Updates both state and targetState for immediate effect.
   */
  public setPosition(worldX: number, worldY: number): void {
    this.state.x = worldX;
    this.state.y = worldY;
    this.targetState.x = worldX;
    this.targetState.y = worldY;
  }

  public setRotation(rotation: number): void {
    const normalized = normalizeAngle(rotation);
    this.state.rotation = normalized;
    this.targetState.rotation = normalized;
  }

  public rotateBy(deltaDegrees: number): void {
    this.targetState.rotation = normalizeAngle(this.targetState.rotation + deltaDegrees);
  }

  public setPivot(worldX: number, worldY: number): void {
    this.pivotX = worldX;
    this.pivotY = worldY;
  }

  public getPivot(): { x: number; y: number } {
    return { x: this.pivotX, y: this.pivotY };
  }

  /**
   * Smoothly animate camera to fit the given world-space bounds.
   * Used on game start and when pressing a "fit all" button.
   */
  public fitBounds(bounds: WorldBounds, padding = 100, rotation = this.targetState.rotation): void {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const sampleState: CameraState = {
      x: centerX,
      y: centerY,
      zoom: 1,
      rotation: normalizeAngle(rotation),
    };
    const corners = [
      this.worldToScreenWithState(sampleState, bounds.minX, bounds.minY),
      this.worldToScreenWithState(sampleState, bounds.maxX, bounds.minY),
      this.worldToScreenWithState(sampleState, bounds.maxX, bounds.maxY),
      this.worldToScreenWithState(sampleState, bounds.minX, bounds.maxY),
    ];
    const minScreenX = Math.min(...corners.map((corner) => corner.x));
    const maxScreenX = Math.max(...corners.map((corner) => corner.x));
    const minScreenY = Math.min(...corners.map((corner) => corner.y));
    const maxScreenY = Math.max(...corners.map((corner) => corner.y));
    const widthAtUnitZoom = maxScreenX - minScreenX;
    const heightAtUnitZoom = maxScreenY - minScreenY;
    const zoomX = (this.viewportWidth - padding * 2) / Math.max(widthAtUnitZoom, 1);
    const zoomY = (this.viewportHeight - padding * 2) / Math.max(heightAtUnitZoom, 1);
    const targetZoom = clamp(Math.min(zoomX, zoomY), this.minZoom, this.maxZoom);

    this.state.zoom = targetZoom;
    this.state.x = centerX;
    this.state.y = centerY;
    this.state.rotation = sampleState.rotation;
    this.targetState.zoom = targetZoom;
    this.targetState.x = centerX;
    this.targetState.y = centerY;
    this.targetState.rotation = sampleState.rotation;
  }

  /**
   * Update viewport dimensions (on resize).
   */
  public setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Tick: interpolate current state toward target state for smooth movement.
   * Call once per frame. Uses lerp with a smoothing factor.
   */
  public update(dt: number): void {
    const smoothing = 1 - Math.pow(0.5, dt / 10);
    this.state.x = lerp(this.state.x, this.targetState.x, smoothing);
    this.state.y = lerp(this.state.y, this.targetState.y, smoothing);
    this.state.zoom = lerp(this.state.zoom, this.targetState.zoom, smoothing);
    const rotationDelta = shortestAngleDelta(this.state.rotation, this.targetState.rotation);
    this.state.rotation = normalizeAngle(this.state.rotation + rotationDelta * smoothing);
  }

  // ─── Getters ───────────────────────────────────────────

  public getState(): Readonly<CameraState> {
    return this.state;
  }

  public getZoom(): number {
    return this.state.zoom;
  }

  public getMinZoom(): number {
    return this.minZoom;
  }

  public getMaxZoom(): number {
    return this.maxZoom;
  }

  /**
   * Get the portion of the world currently visible.
   * Used for frustum culling.
   */
  public getWorldBoundsVisible(): WorldBounds {
    const corners = [
      this.screenToWorld(0, 0),
      this.screenToWorld(this.viewportWidth, 0),
      this.screenToWorld(this.viewportWidth, this.viewportHeight),
      this.screenToWorld(0, this.viewportHeight),
    ];
    const inflate = 48 / Math.max(this.state.zoom, 0.001);
    return {
      minX: Math.min(...corners.map((corner) => corner.x)) - inflate,
      maxX: Math.max(...corners.map((corner) => corner.x)) + inflate,
      minY: Math.min(...corners.map((corner) => corner.y)) - inflate,
      maxY: Math.max(...corners.map((corner) => corner.y)) + inflate,
    };
  }

  public getViewport(): { width: number; height: number } {
    return { width: this.viewportWidth, height: this.viewportHeight };
  }
}

// ─── Utility Functions ─────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle <= -180) {
    angle += 360;
  } else if (angle > 180) {
    angle -= 360;
  }
  return angle;
}

export function shortestAngleDelta(from: number, to: number): number {
  return normalizeAngle(to - from);
}
