import type { DragState, InputCallbacks, LassoState } from "@/types/input";
import type { PlanetId } from "@/types/game";
import { eventToCanvasPosition } from "@/input/InputMapper";

export class InputManager {
  private dragState: DragState | null = null;
  private lassoState: LassoState | null = null;
  private hoverPlanetId: PlanetId | null = null;
  private hoverPos: { x: number; y: number } | null = null;
  private hoverStartMs = 0;
  private selectedPlanetIds = new Set<PlanetId>();
  private pointerDownPlanetId: PlanetId | null = null;
  private pointerDownPos: { x: number; y: number } | null = null;
  private selectMode = false;
  private readonly options = { passive: false } as AddEventListenerOptions;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: InputCallbacks,
  ) {}

  public getDragState(): DragState | null {
    return this.dragState;
  }

  public getHoverPlanetId(): PlanetId | null {
    return this.hoverPlanetId;
  }

  public getHoverPos(): { x: number; y: number } | null {
    return this.hoverPos;
  }

  public getHoverDurationMs(nowMs: number): number {
    if (this.hoverPlanetId === null || this.hoverStartMs === 0) {
      return 0;
    }
    return nowMs - this.hoverStartMs;
  }

  public getSelectedPlanetIds(): Set<PlanetId> {
    return new Set(this.selectedPlanetIds);
  }

  public clearSelection(): void {
    this.selectedPlanetIds.clear();
    this.dragState = null;
    this.lassoState = null;
  }

  public selectAll(): void {
    const allOwnedIds = this.callbacks.getAllOwnedPlanetIds();
    this.selectedPlanetIds.clear();
    for (const id of allOwnedIds) {
      this.selectedPlanetIds.add(id);
    }
  }

  public deselectAll(): void {
    this.clearSelection();
  }

  public getLassoState(): LassoState | null {
    return this.lassoState;
  }

  public setSelectMode(enabled: boolean): void {
    this.selectMode = enabled;
  }

  /**
   * Returns true if the InputManager is currently handling a fleet-selection drag or box selection.
   * Used by CameraController to avoid conflicts between pan and fleet selection/box selection.
   */
  public isInteracting(): boolean {
    return this.dragState !== null || this.lassoState !== null;
  }

  public attach(): void {
    this.canvas.addEventListener("mousedown", this.handleDown, this.options);
    this.canvas.addEventListener("mousemove", this.handleMove, this.options);
    this.canvas.addEventListener("mouseup", this.handleUp, this.options);
    this.canvas.addEventListener("touchstart", this.handleDown, this.options);
    this.canvas.addEventListener("touchmove", this.handleMove, this.options);
    this.canvas.addEventListener("touchend", this.handleUp, this.options);
  }

  public detach(): void {
    this.canvas.removeEventListener("mousedown", this.handleDown);
    this.canvas.removeEventListener("mousemove", this.handleMove);
    this.canvas.removeEventListener("mouseup", this.handleUp);
    this.canvas.removeEventListener("touchstart", this.handleDown);
    this.canvas.removeEventListener("touchmove", this.handleMove);
    this.canvas.removeEventListener("touchend", this.handleUp);
  }

  private readonly handleDown = (event: MouseEvent | TouchEvent): void => {
    if ("button" in event && event.button !== 0) {
      return;
    }
    event.preventDefault();
    const screenPos = eventToCanvasPosition(this.canvas, event);
    // Convert to world coordinates for hit testing
    const worldPos = this.callbacks.screenToWorld(screenPos.x, screenPos.y);
    const planetId = this.callbacks.getPlanetAt(worldPos);
    const additive = this.isAdditiveSelection(event);
    this.pointerDownPlanetId = planetId;
    this.pointerDownPos = screenPos;
    if (planetId === null) {
      if (!("touches" in event)) {
        // Desktop empty-space drag starts lasso by default.
        this.lassoState = {
          startScreen: screenPos,
          currentScreen: screenPos,
          startWorld: worldPos,
          currentWorld: worldPos,
        };
      } else if (!additive) {
        // Mobile empty-space touch should not clear selection immediately; camera pan handles it.
        this.dragState = null;
      } else {
        this.clearSelection();
      }
      return;
    }

    if (!this.callbacks.isOwnedByPlayer(planetId)) {
      if (!additive) {
        this.clearSelection();
      }
      return;
    }

    if (!additive && !this.selectedPlanetIds.has(planetId)) {
      this.selectedPlanetIds.clear();
      this.selectedPlanetIds.add(planetId);
    } else if (additive) {
      if (this.selectedPlanetIds.has(planetId)) {
        this.selectedPlanetIds.delete(planetId);
      } else {
        this.selectedPlanetIds.add(planetId);
      }
    }

    if (this.selectedPlanetIds.size > 0) {
      // Store drag position in world coordinates
      this.dragState = { fromPlanetIds: Array.from(this.selectedPlanetIds), current: worldPos };
    }
  };

  private readonly handleMove = (event: MouseEvent | TouchEvent): void => {
    if ("buttons" in event && event.buttons === 0 && !("touches" in event)) {
      return;
    }
    event.preventDefault();
    const screenPos = eventToCanvasPosition(this.canvas, event);
    this.hoverPos = screenPos;
    // Convert to world coordinates for hit testing
    const worldPos = this.callbacks.screenToWorld(screenPos.x, screenPos.y);
    const nextHover = this.callbacks.getPlanetAt(worldPos);
    if (nextHover !== this.hoverPlanetId) {
      this.hoverPlanetId = nextHover;
      this.hoverStartMs = performance.now();
    }
    if (this.dragState) {
      // Update drag position in world coordinates
      this.dragState.current = worldPos;
    }
    if (this.lassoState) {
      // Update lasso selection position
      this.lassoState.currentScreen = screenPos;
      this.lassoState.currentWorld = worldPos;
    }
  };

  private readonly handleUp = (event: MouseEvent | TouchEvent): void => {
    if ("button" in event && event.button !== 0) {
      return;
    }
    event.preventDefault();
    const screenPos = eventToCanvasPosition(this.canvas, event);
    // Convert to world coordinates for hit testing
    const worldPos = this.callbacks.screenToWorld(screenPos.x, screenPos.y);
    const target = this.callbacks.getPlanetAt(worldPos);
    const moved =
      this.pointerDownPos !== null &&
      Math.hypot(screenPos.x - this.pointerDownPos.x, screenPos.y - this.pointerDownPos.y) > 8;

    // Handle lasso selection completion
    if (this.lassoState) {
      if (moved) {
        const minX = Math.min(this.lassoState.startWorld.x, this.lassoState.currentWorld.x);
        const maxX = Math.max(this.lassoState.startWorld.x, this.lassoState.currentWorld.x);
        const minY = Math.min(this.lassoState.startWorld.y, this.lassoState.currentWorld.y);
        const maxY = Math.max(this.lassoState.startWorld.y, this.lassoState.currentWorld.y);

        const planetsInBox = this.callbacks.getPlanetsInBox(minX, minY, maxX, maxY);
        if (!this.isAdditiveSelection(event)) {
          this.selectedPlanetIds.clear();
        }
        for (const planetId of planetsInBox) {
          this.selectedPlanetIds.add(planetId);
        }
      } else {
        this.selectedPlanetIds.clear();
      }
      this.lassoState = null;
      this.pointerDownPos = null;
      this.pointerDownPlanetId = null;
      return;
    }

    if (!this.dragState || this.dragState.fromPlanetIds.length === 0) {
      this.pointerDownPos = null;
      this.pointerDownPlanetId = null;
      return;
    }

    if (target !== null && moved && !this.dragState.fromPlanetIds.includes(target)) {
      this.callbacks.onFleetDispatch(this.dragState.fromPlanetIds, target);
    } else if (!moved && target === null) {
      this.selectedPlanetIds.clear();
    }

    this.dragState = null;
    this.pointerDownPos = null;
    this.pointerDownPlanetId = null;
  };

  private isAdditiveSelection(event: MouseEvent | TouchEvent): boolean {
    if (this.selectMode) {
      return true;
    }
    if ("shiftKey" in event && event.shiftKey) {
      return true;
    }
    if ("touches" in event && event.touches.length >= 2) {
      return true;
    }
    return false;
  }
}
