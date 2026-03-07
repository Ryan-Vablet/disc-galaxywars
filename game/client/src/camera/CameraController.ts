import type { Camera } from "./Camera";

interface CameraControllerOptions {
  onResetView?: () => void;
}

/**
 * CameraController handles input events for camera control.
 *
 * Coordinates with InputManager to avoid conflicts:
 * - CameraController only handles pan when InputManager.isInteracting() returns false
 * - This ensures fleet selection (drag on owned planets) takes priority
 */
export class CameraController {
  private isPanning = false;
  private isRotating = false;
  private lastPointerPos: { x: number; y: number } | null = null;
  private pinchStartDistance: number | null = null;
  private pinchStartAngle: number | null = null;
  private pinchStartZoom = 1;
  private pinchStartRotation = 0;
  private pinchCenter: { x: number; y: number } | null = null;
  private arrowKeys = { up: false, down: false, left: false, right: false };
  private readonly options = { passive: false } as AddEventListenerOptions;

  constructor(
    private readonly camera: Camera,
    private readonly canvas: HTMLCanvasElement,
    private readonly inputManager: { isInteracting: () => boolean },
    private readonly config: CameraControllerOptions = {},
  ) {}

  /**
   * Attach event listeners for camera control.
   */
  public attach(): void {
    // Mouse events
    this.canvas.addEventListener("wheel", this.handleWheel, this.options);
    this.canvas.addEventListener("mousedown", this.handlePointerDown, this.options);
    window.addEventListener("mousemove", this.handlePointerMove);
    window.addEventListener("mouseup", this.handlePointerUp);

    // Touch events
    this.canvas.addEventListener("touchstart", this.handleTouchStart, this.options);
    this.canvas.addEventListener("touchmove", this.handleTouchMove, this.options);
    window.addEventListener("touchend", this.handleTouchEnd);

    // Keyboard events
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  /**
   * Detach event listeners.
   */
  public detach(): void {
    // Mouse events
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("mousedown", this.handlePointerDown);
    window.removeEventListener("mousemove", this.handlePointerMove);
    window.removeEventListener("mouseup", this.handlePointerUp);

    // Touch events
    this.canvas.removeEventListener("touchstart", this.handleTouchStart);
    this.canvas.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);

    // Keyboard events
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  /**
   * Update arrow key pan (call each frame).
   */
  public updateArrowKeys(dt: number): void {
    const panSpeed = 0.5; // world units per millisecond
    const rotationSpeed = 0.09; // degrees per millisecond
    let dx = 0;
    let dy = 0;

    if (this.arrowKeys.left) dx -= panSpeed * dt;
    if (this.arrowKeys.right) dx += panSpeed * dt;
    if (this.arrowKeys.up) dy -= panSpeed * dt;
    if (this.arrowKeys.down) dy += panSpeed * dt;

    if (dx !== 0 || dy !== 0) {
      const zoom = this.camera.getZoom();
      const screenDx = dx * zoom;
      const screenDy = dy * zoom;
      this.camera.pan(screenDx, screenDy);
    }

    if (this.rotateLeft) {
      this.camera.rotateBy(-rotationSpeed * dt);
    }
    if (this.rotateRight) {
      this.camera.rotateBy(rotationSpeed * dt);
    }
  }

  private rotateLeft = false;
  private rotateRight = false;

  private readonly handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const delta = -Math.sign(e.deltaY) * 0.1;
    if (e.shiftKey) {
      this.camera.rotateBy(delta * 18);
      return;
    }
    this.camera.zoomAt(canvasX, canvasY, delta);
  };

  private readonly handlePointerDown = (e: MouseEvent): void => {
    if (e.button === 2) {
      this.isPanning = true;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    if (e.button === 1) {
      this.isRotating = true;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    if (this.inputManager.isInteracting()) {
      return;
    }
    if (e.button === 0) {
      this.isPanning = true;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
    }
  };

  private readonly handlePointerMove = (e: MouseEvent): void => {
    if (!this.lastPointerPos) {
      return;
    }

    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    if (this.isPanning) {
      this.camera.pan(dx, dy);
    } else if (this.isRotating) {
      this.camera.rotateBy(dx * 0.25);
    }
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private readonly handlePointerUp = (): void => {
    this.isPanning = false;
    this.isRotating = false;
    this.lastPointerPos = null;
  };

  private readonly handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (t0 && t1) {
        this.pinchStartDistance = this.getTouchDistance(t0, t1);
        this.pinchStartAngle = this.getTouchAngle(t0, t1);
        this.pinchStartZoom = this.camera.getZoom();
        this.pinchStartRotation = this.camera.getState().rotation;
        this.pinchCenter = this.getTouchCenter(t0, t1);
      }
      return;
    }

    if (e.touches.length === 1 && !this.inputManager.isInteracting()) {
      const t0 = e.touches[0];
      if (!t0) {
        return;
      }
      this.isPanning = true;
      this.lastPointerPos = { x: t0.clientX, y: t0.clientY };
    }
  };

  private readonly handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 2 && this.pinchStartDistance !== null) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (t0 && t1) {
        const d = this.getTouchDistance(t0, t1);
        const scale = d / this.pinchStartDistance;
        const newZoom = this.pinchStartZoom * scale;
        const angle = this.getTouchAngle(t0, t1);
        const angleDelta = angle - (this.pinchStartAngle ?? angle);

        const center = this.getTouchCenter(t0, t1);
        this.camera.setZoom(newZoom);
        this.camera.setRotation(this.pinchStartRotation + angleDelta);

        if (this.pinchCenter) {
          const centerDx = center.x - this.pinchCenter.x;
          const centerDy = center.y - this.pinchCenter.y;
          this.camera.pan(centerDx, centerDy);
        }

        this.pinchCenter = center;
      }
    } else if (e.touches.length === 1 && this.isPanning && this.lastPointerPos && !this.inputManager.isInteracting()) {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) {
        return;
      }
      const dx = touch.clientX - this.lastPointerPos.x;
      const dy = touch.clientY - this.lastPointerPos.y;
      this.camera.pan(dx, dy);
      this.lastPointerPos = { x: touch.clientX, y: touch.clientY };
    }
  };

  private readonly handleTouchEnd = (): void => {
    this.pinchStartDistance = null;
    this.pinchStartAngle = null;
    this.pinchStartZoom = 1;
    this.pinchCenter = null;
    this.isPanning = false;
    this.lastPointerPos = null;
  };

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case "+":
      case "=":
        this.camera.zoomAt(
          this.camera.getViewport().width / 2,
          this.camera.getViewport().height / 2,
          0.2,
        );
        break;
      case "-":
      case "_":
        this.camera.zoomAt(
          this.camera.getViewport().width / 2,
          this.camera.getViewport().height / 2,
          -0.2,
        );
        break;
      case "Home":
      case "f":
      case "F": {
        this.config.onResetView?.();
        break;
      }
      case "ArrowUp":
        this.arrowKeys.up = true;
        break;
      case "ArrowDown":
        this.arrowKeys.down = true;
        break;
      case "ArrowLeft":
        this.arrowKeys.left = true;
        break;
      case "ArrowRight":
        this.arrowKeys.right = true;
        break;
      case "q":
      case "Q":
        this.rotateLeft = true;
        break;
      case "e":
      case "E":
        this.rotateRight = true;
        break;
    }
  };

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.key) {
      case "ArrowUp":
        this.arrowKeys.up = false;
        break;
      case "ArrowDown":
        this.arrowKeys.down = false;
        break;
      case "ArrowLeft":
        this.arrowKeys.left = false;
        break;
      case "ArrowRight":
        this.arrowKeys.right = false;
        break;
      case "q":
      case "Q":
        this.rotateLeft = false;
        break;
      case "e":
      case "E":
        this.rotateRight = false;
        break;
    }
  };

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }

  private getTouchAngle(touch1: Touch, touch2: Touch): number {
    return (Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180) / Math.PI;
  }
}
