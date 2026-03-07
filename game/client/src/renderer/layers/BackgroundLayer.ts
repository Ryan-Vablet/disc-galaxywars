import { COLORS, VISUAL_CONSTANTS } from "@/constants/visual";
import type { RenderContext, RenderLayer } from "@/renderer/types";
import { StarSprites } from "@/renderer/StarSprites";

/**
 * Parallax factors for background depth effect.
 * Lower values = appear farther away (move slower).
 */
const PARALLAX_FACTORS = {
  nebula: 0.02, // Barely moves - feels infinitely far
  stars: 0.05, // Subtle drift
} as const;

const ROTATION_FACTORS = {
  nebula: 0.1,
  stars: 0.2,
} as const;

export class BackgroundLayer implements RenderLayer {
  private starSprites: StarSprites | null = null;

  private ensureStarSprites(width: number, height: number): void {
    if (!this.starSprites) {
      this.starSprites = new StarSprites(width, height);
    }
  }
  public render(ctx: CanvasRenderingContext2D, state: RenderContext): void {
    const w = state.canvasWidth;
    const h = state.canvasHeight;

    this.ensureStarSprites(w, h);

    // Update star sprite animations
    if (this.starSprites) {
      this.starSprites.update(state.timeMs / 1000);
    }

    const cameraState = state.camera.getState();

    if (state.starfieldCanvas) {
      // Draw nebula background with parallax
      // Draw larger than viewport to avoid edge artifacts when parallax is applied
      const padding = 500;
      ctx.save();
      this.applyParallaxTransform(
        ctx,
        cameraState,
        PARALLAX_FACTORS.nebula,
        ROTATION_FACTORS.nebula,
        w,
        h,
      );
      // Draw starfield stretched to cover padded area
      ctx.drawImage(state.starfieldCanvas, -padding, -padding, w + padding * 2, h + padding * 2);
      ctx.restore();

      // Draw animated star sprites with parallax
      if (this.starSprites) {
        ctx.save();
        this.applyParallaxTransform(
          ctx,
          cameraState,
          PARALLAX_FACTORS.stars,
          ROTATION_FACTORS.stars,
          w,
          h,
        );
        this.starSprites.render(ctx);
        ctx.restore();
      }
    } else {
      this.renderFallback(ctx, state, cameraState);
    }

    // Grid removed - wasn't adding value
  }

  /**
   * Apply parallax transform for a background layer.
   * Parallax creates depth by moving distant layers slower than closer ones.
   */
  private applyParallaxTransform(
    ctx: CanvasRenderingContext2D,
    cameraState: { x: number; y: number; zoom: number; rotation: number },
    parallaxFactor: number,
    rotationFactor: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const offsetX = -cameraState.x * parallaxFactor;
    const offsetY = -cameraState.y * parallaxFactor;
    const parallaxZoom = 1 + (cameraState.zoom - 1) * parallaxFactor;
    const parallaxRotation = (cameraState.rotation * rotationFactor * Math.PI) / 180;
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate(parallaxRotation);
    ctx.scale(parallaxZoom, parallaxZoom);
    ctx.translate(offsetX - canvasWidth / 2, offsetY - canvasHeight / 2);
  }

  private renderFallback(
    ctx: CanvasRenderingContext2D,
    state: RenderContext,
    cameraState: { x: number; y: number; zoom: number; rotation: number },
  ): void {
    const driftX = Math.sin(state.timeMs * 0.0005) * 2;
    const driftY = Math.cos(state.timeMs * 0.0004) * 2;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(-10, -10, state.canvasWidth + 20, state.canvasHeight + 20);

    // Draw nebulae with parallax
    ctx.save();
    this.applyParallaxTransform(
      ctx,
      cameraState,
      PARALLAX_FACTORS.nebula,
      ROTATION_FACTORS.nebula,
      state.canvasWidth,
      state.canvasHeight,
    );
    for (const nebula of state.visualState.nebulae) {
      const nx = nebula.x + driftX;
      const ny = nebula.y + driftY;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nebula.radius);
      const c = nebula.color === "cyan" ? "0,180,220" : "180,30,60";
      grad.addColorStop(0, `rgba(${c},${nebula.alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(${c},${nebula.alpha * 0.5})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(nx - nebula.radius, ny - nebula.radius, nebula.radius * 2, nebula.radius * 2);
    }
    ctx.restore();

    this.drawStars(ctx, state, driftX, driftY, cameraState);
  }

  private drawStars(
    ctx: CanvasRenderingContext2D,
    state: RenderContext,
    driftX: number,
    driftY: number,
    cameraState: { x: number; y: number; zoom: number; rotation: number },
  ): void {
    ctx.save();
    this.applyParallaxTransform(
      ctx,
      cameraState,
      PARALLAX_FACTORS.stars,
      ROTATION_FACTORS.stars,
      state.canvasWidth,
      state.canvasHeight,
    );
    for (const star of state.visualState.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(state.timeMs * star.twinkleSpeed + star.twinklePhase);
      ctx.globalAlpha = star.brightness * twinkle;
      ctx.fillStyle = COLORS.stars;
      ctx.beginPath();
      ctx.arc(star.x + driftX, star.y + driftY, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
