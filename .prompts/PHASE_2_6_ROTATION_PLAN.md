Here is GLM-4.7's plan for a rotation feature (mainly so that we can eventually get auto align to fit canvas best on return to home and game start (right now the top bottom homeworld start and orientation on a horizontal screen doesn't work but works great on phone in portrait)):
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Solar System Rotation Feature Implementation Plan

 Summary

 Add rotation controls to rotate the entire solar system around the sun (world origin 0,0) with:
 - Slider control (like zoom slider)
 - SHIFT + Mouse Wheel Up/Down to rotate
 - SHIFT + Middle Mouse Drag to rotate
 - HOME key resets rotation to 0°

 Critical Files to Modify

 | File                                              | Changes                               |
 |---------------------------------------------------|---------------------------------------|
 | game/client/src/camera/Camera.ts                  | Add rotation state, math, and methods |
 | game/client/src/camera/CameraController.ts        | Add rotation input handling           |
 | game/client/src/ui/components/RotationControls.ts | NEW - Rotation slider UI component    |
 | game/client/src/ui/components/GameCanvas.ts       | Integrate RotationControls            |
 | game/client/src/ui/styles/global.css              | Add rotation controls CSS             |

 ---
 Step 1: Update Camera.ts - Add Rotation State

 File: game/client/src/camera/Camera.ts

 1.1 Update CameraState interface (line 14)

 export interface CameraState {
   x: number;
   y: number;
   zoom: number;
   rotation: number; // NEW: Rotation angle in degrees (0-360)
 }

 1.2 Update constructor (line 51)

 this.state = { x: 0, y: 0, zoom: 1.0, rotation: 0 };
 this.targetState = { x: 0, y: 0, zoom: 1.0, rotation: 0 };

 1.3 Add utility functions after lerp (line 255)

 function normalizeAngle(angle: number): number {
   let normalized = angle % 360;
   if (normalized < 0) normalized += 360;
   return normalized;
 }

 function toRadians(degrees: number): number {
   return degrees * (Math.PI / 180);
 }

 1.4 Update worldToScreen (line 58)

 public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
   // Apply rotation around origin (0,0) - the sun's position
   const angleRad = toRadians(this.state.rotation);
   const cos = Math.cos(angleRad);
   const sin = Math.sin(angleRad);

   const rotatedX = worldX * cos - worldY * sin;
   const rotatedY = worldX * sin + worldY * cos;

   return {
     x: (rotatedX - this.state.x) * this.state.zoom + this.viewportWidth / 2,
     y: (rotatedY - this.state.y) * this.state.zoom + this.viewportHeight / 2,
   };
 }

 1.5 Update screenToWorld (line 68)

 public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
   const preRotationX = (screenX - this.viewportWidth / 2) / this.state.zoom + this.state.x;
   const preRotationY = (screenY - this.viewportHeight / 2) / this.state.zoom + this.state.y;

   // Apply inverse rotation
   const angleRad = toRadians(-this.state.rotation);
   const cos = Math.cos(angleRad);
   const sin = Math.sin(angleRad);

   return {
     x: preRotationX * cos - preRotationY * sin,
     y: preRotationX * sin + preRotationY * cos,
   };
 }

 1.6 Update applyTransform (line 87)

 public applyTransform(ctx: CanvasRenderingContext2D): void {
   ctx.save();
   ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
   ctx.scale(this.state.zoom, this.state.zoom);
   ctx.rotate(toRadians(this.state.rotation)); // NEW
   ctx.translate(-this.state.x, -this.state.y);
 }

 1.7 Add rotation methods after setPosition (line 158)

 public rotate(deltaAngleDegrees: number): void {
   this.targetState.rotation = normalizeAngle(this.targetState.rotation + deltaAngleDegrees);
 }

 public setRotation(angleDegrees: number): void {
   const normalized = normalizeAngle(angleDegrees);
   this.state.rotation = normalized;
   this.targetState.rotation = normalized;
 }

 public getRotation(): number {
   return this.state.rotation;
 }

 1.8 Update update method for smooth interpolation (line 201)

 public update(dt: number): void {
   const smoothing = 1 - Math.pow(0.5, dt / 10);
   this.state.x = lerp(this.state.x, this.targetState.x, smoothing);
   this.state.y = lerp(this.state.y, this.targetState.y, smoothing);
   this.state.zoom = lerp(this.state.zoom, this.targetState.zoom, smoothing);

   // Handle rotation wrap-around interpolation
   let rotationDelta = this.targetState.rotation - this.state.rotation;
   if (rotationDelta > 180) rotationDelta -= 360;
   if (rotationDelta < -180) rotationDelta += 360;
   this.state.rotation = normalizeAngle(this.state.rotation + rotationDelta * smoothing);
 }

 1.9 Update setPosition and fitBounds to reset rotation

 // In setPosition (line 153):
 this.state.rotation = 0;
 this.targetState.rotation = 0;

 // In fitBounds (line 181):
 this.state.rotation = 0;
 this.targetState.rotation = 0;

 ---
 Step 2: Create RotationControls Component

 File: game/client/src/ui/components/RotationControls.ts (NEW)

 import type { Camera } from "@/camera/Camera";

 /**
  * RotationControls provides UI controls for camera rotation.
  * Positioned to the left of zoom controls.
  */
 export class RotationControls {
   private container: HTMLDivElement;
   private rotateLeftButton: HTMLButtonElement;
   private rotateRightButton: HTMLButtonElement;
   private resetButton: HTMLButtonElement;
   private slider: HTMLInputElement;
   private isDestroyed = false;
   private lastKnownRotation = 0;

   public constructor(
     private readonly camera: Camera,
     private readonly parentElement: HTMLElement,
   ) {
     this.container = document.createElement("div");
     this.container.className = "rotationControls";

     this.rotateLeftButton = document.createElement("button");
     this.rotateLeftButton.className = "rotationButton";
     this.rotateLeftButton.textContent = "↶";
     this.rotateLeftButton.title = "Rotate Left";
     this.rotateLeftButton.onclick = () => this.rotateLeft();

     this.rotateRightButton = document.createElement("button");
     this.rotateRightButton.className = "rotationButton";
     this.rotateRightButton.textContent = "↷";
     this.rotateRightButton.title = "Rotate Right";
     this.rotateRightButton.onclick = () => this.rotateRight();

     this.resetButton = document.createElement("button");
     this.resetButton.className = "rotationButton resetButton";
     this.resetButton.textContent = "↺";
     this.resetButton.title = "Reset Rotation (Home)";
     this.resetButton.onclick = () => this.resetRotation();

     this.slider = document.createElement("input");
     this.slider.type = "range";
     this.slider.className = "rotationSlider";
     this.slider.min = "0";
     this.slider.max = "360";
     this.slider.step = "1";
     this.slider.title = "Rotation Angle";

     this.slider.addEventListener("input", () => {
       const angle = parseFloat(this.slider.value);
       this.camera.setRotation(angle);
     });

     this.container.append(
       this.rotateLeftButton,
       this.slider,
       this.rotateRightButton,
       this.resetButton,
     );

     this.parentElement.appendChild(this.container);
     this.startUpdateLoop();
   }

   private rotateLeft(): void {
     this.camera.rotate(-15);
   }

   private rotateRight(): void {
     this.camera.rotate(15);
   }

   private resetRotation(): void {
     this.camera.setRotation(0);
   }

   private syncSlider(): void {
     const currentRotation = this.camera.getRotation();
     if (currentRotation !== this.lastKnownRotation) {
       this.lastKnownRotation = currentRotation;
       this.slider.value = String(currentRotation);
     }
   }

   private startUpdateLoop(): void {
     const update = (): void => {
       if (this.isDestroyed) return;
       this.syncSlider();
       requestAnimationFrame(update);
     };
     requestAnimationFrame(update);
   }

   public destroy(): void {
     this.isDestroyed = true;
     this.container.remove();
   }
 }

 ---
 Step 3: Update CameraController for Input Handling

 File: game/client/src/camera/CameraController.ts

 3.1 Add rotation state property (line 11)

 private isRotating = false;

 3.2 Update handleWheel for SHIFT+wheel rotation (line 87)

 private readonly handleWheel = (e: WheelEvent): void => {
   e.preventDefault();
   const rect = this.canvas.getBoundingClientRect();
   const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
   const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

   if (e.shiftKey) {
     // Rotation mode: 5 degrees per scroll tick
     const delta = -Math.sign(e.deltaY) * 5;
     this.camera.rotate(delta);
   } else {
     // Normal zoom mode
     const delta = -Math.sign(e.deltaY) * 0.1;
     this.camera.zoomAt(canvasX, canvasY, delta);
   }
 };

 3.3 Update handlePointerDown for rotation drag (line 98)

 private readonly handlePointerDown = (e: MouseEvent): void => {
   if (this.inputManager.isInteracting()) return;

   // Middle button or SHIFT+left button -> rotation
   const isRotationMode = e.button === 1 || (e.button === 0 && e.shiftKey);
   // Left button (without SHIFT) -> pan
   const isPanMode = e.button === 0 && !e.shiftKey;

   if (isRotationMode) {
     this.isRotating = true;
     this.lastPointerPos = { x: e.clientX, y: e.clientY };
   } else if (isPanMode) {
     this.isPanning = true;
     this.lastPointerPos = { x: e.clientX, y: e.clientY };
   }
 };

 3.4 Update handlePointerMove for rotation drag (line 109)

 private readonly handlePointerMove = (e: MouseEvent): void => {
   if (!this.lastPointerPos) return;

   const dx = e.clientX - this.lastPointerPos.x;
   const dy = e.clientY - this.lastPointerPos.y;

   if (this.isRotating) {
     // Horizontal movement rotates (0.5 degrees per pixel)
     this.camera.rotate(dx * 0.5);
     this.lastPointerPos = { x: e.clientX, y: e.clientY };
   } else if (this.isPanning) {
     this.camera.pan(dx, dy);
     this.lastPointerPos = { x: e.clientX, y: e.clientY };
   }
 };

 3.5 Update handlePointerUp (line 118)

 private readonly handlePointerUp = (): void => {
   this.isPanning = false;
   this.isRotating = false;
   this.lastPointerPos = null;
 };

 3.6 Update handleKeyDown to reset rotation (line 200)

 case "Home":
 case "f":
 case "F": {
   this.camera.setPosition(0, 0);
   this.camera.setZoom(1);
   this.camera.setRotation(0); // NEW
   break;
 }

 ---
 Step 4: Update CSS Styles

 File: game/client/src/ui/styles/global.css

 Add after .zoomSlider::-moz-range-thumb:hover (after line 723):

 /* ─── Rotation Controls ───────────────────────────────────────── */

 .rotationControls {
   position: absolute;
   bottom: 16px;
   right: 70px; /* Positioned left of zoom controls */
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 6px;
   background: rgba(5, 8, 15, 0.7);
   border: 1px solid rgba(0, 229, 255, 0.3);
   border-radius: 6px;
   padding: 8px;
   z-index: 10;
   pointer-events: auto;
 }

 .rotationButton {
   width: 32px;
   height: 32px;
   display: flex;
   align-items: center;
   justify-content: center;
   background: rgba(0, 229, 255, 0.1);
   border: 1px solid rgba(0, 229, 255, 0.3);
   border-radius: 4px;
   color: #9bc5ce;
   font-size: 16px;
   font-family: inherit;
   cursor: pointer;
   transition: all 0.15s ease;
   padding: 0;
 }

 .rotationButton:hover {
   background: rgba(0, 229, 255, 0.25);
   color: #00e5ff;
   border-color: rgba(0, 229, 255, 0.6);
 }

 .rotationButton:active {
   transform: scale(0.95);
 }

 .resetButton {
   font-size: 14px;
 }

 .rotationSlider {
   -webkit-appearance: none;
   appearance: none;
   width: 8px;
   height: 100px;
   background: rgba(0, 229, 255, 0.15);
   border-radius: 4px;
   outline: none;
   writing-mode: bt-lr;
   -webkit-appearance: slider-vertical;
   accent-color: #00e5ff;
 }

 .rotationSlider::-webkit-slider-thumb {
   -webkit-appearance: none;
   appearance: none;
   width: 16px;
   height: 16px;
   background: #00e5ff;
   border-radius: 50%;
   cursor: pointer;
   transition: transform 0.15s ease;
 }

 .rotationSlider::-webkit-slider-thumb:hover {
   transform: scale(1.2);
 }

 .rotationSlider::-moz-range-thumb {
   width: 16px;
   height: 16px;
   background: #00e5ff;
   border: none;
   border-radius: 50%;
   cursor: pointer;
   transition: transform 0.15s ease;
 }

 .rotationSlider::-moz-range-thumb:hover {
   transform: scale(1.2);
 }

 ---
 Step 5: Integrate RotationControls into GameCanvas

 File: game/client/src/ui/components/GameCanvas.ts

 5.1 Add import (line 11)

 import { RotationControls } from "@/ui/components/RotationControls";

 5.2 Add property (line 26)

 private rotationControls: RotationControls | null = null;

 5.3 Initialize in mount method (after line 143)

 // Create rotation controls UI
 this.rotationControls = new RotationControls(this.renderer.getCamera(), container);

 5.4 Update destroy method (after line 179)

 this.rotationControls?.destroy();
 this.rotationControls = null;

 ---
 Implementation Notes

 1. Rotation Pivot: Rotation is around world origin (0,0) where the sun is located
 2. Angle Normalization: All angles are normalized to 0-360° range
 3. Smooth Interpolation: Rotation interpolation handles wrap-around (e.g., 350° → 10° goes through 0°)
 4. Input Priority:
   - SHIFT + Mouse Wheel = Rotation (5° per tick)
   - SHIFT + Middle Mouse Drag = Rotation (0.5° per pixel)
   - Regular Mouse Wheel = Zoom
   - Regular Middle Mouse Drag = Pan
 5. UI Layout: Rotation controls positioned at right: 70px (left of zoom controls at right: 16px)

 Testing Checklist

 - Slider rotates smoothly 0-360°
 - SHIFT + Mouse Wheel rotates in both directions
 - SHIFT + Middle Mouse Drag rotates
 - HOME key resets position, zoom, AND rotation to default
 - Planets orbit correctly when rotated
 - Hit testing (planet selection) works with rotation applied
 - Smooth rotation interpolation across 0°/360° boundary
 - Rotation slider syncs with keyboard/mouse rotation